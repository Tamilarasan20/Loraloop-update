import { NextResponse } from "next/server";
import { chromium, Browser } from "playwright";
import { GoogleGenAI } from "@google/genai";

// Support both GEMINI_API_KEY and GOOGLE_API_KEY env vars
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = "https://" + u;
  }
  // Strip trailing whitespace / newlines
  return u;
}

export async function POST(req: Request) {
  let browser: Browser | null = null;
  
  try {
    const body = await req.json();
    const rawUrl = body?.url;

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const url = normalizeUrl(rawUrl);
    console.log("[extract-dna] Starting extraction for:", url);

    // ── 1. SCRAPE WITH PLAYWRIGHT ──────────────────────────────
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1440, height: 900 },
      // Accept cookies automatically
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const page = await context.newPage();

    // Block heavy resources to speed up scraping & avoid blocks
    await page.route("**/*.{mp4,webm,ogg,mp3,wav,flac}", (route) =>
      route.abort()
    );

    try {
      // Use domcontentloaded instead of networkidle — much more reliable
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      // Give JS a moment to render dynamic content
      await page.waitForTimeout(3000);
    } catch (navErr: unknown) {
      const msg = navErr instanceof Error ? navErr.message : String(navErr);
      console.error("[extract-dna] Navigation failed:", msg);
      await browser.close();
      browser = null;
      return NextResponse.json(
        {
          error: `Could not load the website. ${msg.includes("ERR_NAME") ? "Check the URL spelling." : "Make sure the URL is correct and publicly accessible."}`,
        },
        { status: 400 }
      );
    }

    // ── Extract data inside the browser context ──
    const extractionPayload = await page.evaluate(() => {
      const rgb2hex = (rgb: string) => {
        const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return rgb;
        return (
          "#" +
          [m[1], m[2], m[3]]
            .map((n) => parseInt(n, 10).toString(16).padStart(2, "0"))
            .join("")
        );
      };

      // Sample elements for colors / fonts
      const els = [
        document.body,
        ...Array.from(
          document.querySelectorAll(
            "h1,h2,h3,h4,h5,h6,button,a,[role='button'],nav,header,footer,p,span,div"
          )
        ),
      ].slice(0, 150);

      const colors = new Set<string>();
      const fonts = new Set<string>();

      for (const el of els) {
        try {
          const cs = window.getComputedStyle(el);
          const bg = cs.backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            colors.add(rgb2hex(bg));
          }
          if (cs.color) colors.add(rgb2hex(cs.color));
          if (cs.fontFamily) {
            fonts.add(
              cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim()
            );
          }
        } catch {
          /* skip inaccessible elements */
        }
      }

      // Logo detection — multi-strategy
      let logoUrl = "";
      // Strategy 1: <img> with logo in src/alt/class
      const logoImgs = Array.from(document.querySelectorAll("img")).filter(
        (img) => {
          const s = (img.src + img.alt + img.className).toLowerCase();
          return s.includes("logo") || s.includes("brand");
        }
      );
      if (logoImgs.length > 0) {
        logoUrl = logoImgs[0].src;
      }
      // Strategy 2: <link rel="icon">
      if (!logoUrl) {
        const icon = document.querySelector(
          'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
        );
        if (icon) logoUrl = (icon as HTMLLinkElement).href;
      }
      // Strategy 3: og:image
      if (!logoUrl) {
        const og = document.querySelector('meta[property="og:image"]');
        if (og) logoUrl = (og as HTMLMetaElement).content;
      }

      // Images — deduplicated, only sizeable ones
      const seenSrcs = new Set<string>();
      const images: string[] = [];
      for (const img of Array.from(document.querySelectorAll("img"))) {
        const src = img.src || img.getAttribute("data-src") || "";
        if (
          src &&
          !seenSrcs.has(src) &&
          (src.startsWith("http") || src.startsWith("//")) &&
          img.naturalWidth > 80
        ) {
          seenSrcs.add(src);
          images.push(src);
          if (images.length >= 20) break;
        }
      }

      // Text content
      const textEls = Array.from(
        document.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,[class*='hero'],[class*='tagline']")
      );
      const textSample = textEls
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join(" ")
        .slice(0, 3000);

      return {
        colors: Array.from(colors).slice(0, 20),
        fonts: Array.from(fonts).slice(0, 10),
        logoUrl,
        images,
        textSample,
        pageTitle: document.title,
      };
    });

    await browser.close();
    browser = null;

    console.log(
      "[extract-dna] Scrape done. Colors:",
      extractionPayload.colors.length,
      "Fonts:",
      extractionPayload.fonts.length,
      "Images:",
      extractionPayload.images.length
    );

    // ── 2. CHECK GEMINI API KEY ──────────────────────────────
    if (!apiKey) {
      // No API key — return scraped data with sensible defaults so the board still works
      console.warn("[extract-dna] No GEMINI_API_KEY set. Returning raw scrape data.");
      const fallback = {
        brandName: extractionPayload.pageTitle.split("|")[0].split("-")[0].trim() || "Unknown",
        logoUrl: extractionPayload.logoUrl,
        colors: {
          primary: extractionPayload.colors[0] || "#333333",
          secondary: extractionPayload.colors[1] || "#666666",
          background: extractionPayload.colors[2] || "#ffffff",
          textHighContrast: extractionPayload.colors[3] || "#000000",
          accent: extractionPayload.colors[4] || "#0066ff",
        },
        typography: {
          headingFont: extractionPayload.fonts[0] || "Inter",
          bodyFont: extractionPayload.fonts[1] || extractionPayload.fonts[0] || "Inter",
        },
        tagline: "",
        brandValue: "",
        brandAesthetic: "",
        toneOfVoice: "",
        businessOverview: extractionPayload.textSample.slice(0, 300),
        images: extractionPayload.images,
      };
      return NextResponse.json({ dna: fallback });
    }

    // ── 3. GEMINI LLM PROCESSING (with model fallback) ──────────
    const prompt = `Act as an expert Brand Analyst. I scraped these from ${normalizeUrl(rawUrl)}:

Page Title: ${extractionPayload.pageTitle}
Colors: ${extractionPayload.colors.join(", ")}
Fonts: ${extractionPayload.fonts.join(", ")}
Logo URL: ${extractionPayload.logoUrl}
Text: "${extractionPayload.textSample}"

Return ONLY a JSON object with this exact schema (no markdown, no explanation):
{
  "brandName": "string",
  "logoUrl": "${extractionPayload.logoUrl}",
  "colors": { "primary": "#hex", "secondary": "#hex", "background": "#hex", "textHighContrast": "#hex", "accent": "#hex" },
  "typography": { "headingFont": "Google Font name", "bodyFont": "Google Font name" },
  "tagline": "3-8 word tagline",
  "brandValue": "comma-separated core values",
  "brandAesthetic": "comma-separated aesthetic descriptors",
  "toneOfVoice": "comma-separated tone descriptors",
  "businessOverview": "2-3 sentence overview",
  "images": []
}

Map colors semantically. Use commas to separate multiple values in brandValue, brandAesthetic, and toneOfVoice fields.`;

    // Try multiple models in case one hits quota
    const MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let aiText: string | null = null;
    let lastGeminiError = "";

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[extract-dna] Trying model: ${modelName}`);
        const response = await genAI.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        aiText = response.text || null;
        if (aiText) {
          console.log(`[extract-dna] Got response from ${modelName}`);
          break;
        }
      } catch (geminiErr: unknown) {
        const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        console.warn(`[extract-dna] ${modelName} failed:`, errMsg.slice(0, 200));
        lastGeminiError = errMsg;
        // If quota error (429), try next model
        if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
          continue;
        }
        // For other errors, still try next model
        continue;
      }
    }

    // If ALL models failed, return raw scrape data as fallback
    if (!aiText) {
      console.warn("[extract-dna] All Gemini models failed. Returning raw scrape fallback.");
      const fallbackDna = {
        brandName: extractionPayload.pageTitle.split("|")[0].split("-")[0].split("—")[0].trim() || "Unknown",
        logoUrl: extractionPayload.logoUrl,
        colors: {
          primary: extractionPayload.colors[0] || "#333333",
          secondary: extractionPayload.colors[1] || "#666666",
          background: extractionPayload.colors[2] || "#ffffff",
          textHighContrast: extractionPayload.colors[3] || "#000000",
          accent: extractionPayload.colors[4] || "#0066ff",
        },
        typography: {
          headingFont: extractionPayload.fonts[0] || "Inter",
          bodyFont: extractionPayload.fonts[1] || extractionPayload.fonts[0] || "Inter",
        },
        tagline: "",
        brandValue: "",
        brandAesthetic: "",
        toneOfVoice: "",
        businessOverview: extractionPayload.textSample.slice(0, 300),
        images: extractionPayload.images,
      };
      return NextResponse.json({ dna: fallbackDna });
    }

    let parsedDna;
    try {
      parsedDna = JSON.parse(aiText);
    } catch {
      console.error("[extract-dna] Gemini returned invalid JSON:", aiText.slice(0, 200));
      throw new Error("Gemini returned malformed data. Please try again.");
    }

    // Inject scraped images
    parsedDna.images = Array.from(new Set(extractionPayload.images));
    // Ensure logoUrl is preserved if Gemini dropped it
    if (!parsedDna.logoUrl && extractionPayload.logoUrl) {
      parsedDna.logoUrl = extractionPayload.logoUrl;
    }

    console.log("[extract-dna] Success! Brand:", parsedDna.brandName);
    return NextResponse.json({ dna: parsedDna });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected server error occurred.";
    console.error("[extract-dna] Fatal error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
}
