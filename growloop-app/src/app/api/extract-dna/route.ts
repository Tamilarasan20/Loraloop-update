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

    // Block only video/audio — keep images fully intact
    await page.route("**/*.{mp4,webm,ogg,mp3,wav,flac}", (route) =>
      route.abort()
    );

    try {
      // Use domcontentloaded instead of networkidle — much more reliable
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      // Give JS a moment to render dynamic content
      await page.waitForTimeout(2000);
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

    // ── AUTO-SCROLL to trigger lazy-loaded images ──
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const scrollHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      let scrolled = 0;
      while (scrolled < scrollHeight) {
        window.scrollBy(0, viewportHeight);
        scrolled += viewportHeight;
        await delay(300);
      }
      // Scroll back to top
      window.scrollTo(0, 0);
      await delay(500);
    });
    // Wait for lazy images to finish loading after scroll
    await page.waitForTimeout(2000);

    // ── CAPTURE SCREENSHOT for loading preview ──
    const screenshotBuffer = await page.screenshot({ type: "jpeg", quality: 70, fullPage: false });
    const screenshotBase64 = `data:image/jpeg;base64,${screenshotBuffer.toString("base64")}`;

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

      // Helper: check if a hex color is a boring structural color (white, black, near-grays)
      const isStructuralColor = (hex: string) => {
        const h = hex.toLowerCase().replace("#", "");
        if (h.length !== 6) return true;
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        // Pure white, pure black
        if (r === 255 && g === 255 && b === 255) return true;
        if (r === 0 && g === 0 && b === 0) return true;
        // Near-white (all channels > 240)
        if (r > 240 && g > 240 && b > 240) return true;
        // Near-black (all channels < 15)
        if (r < 15 && g < 15 && b < 15) return true;
        // Pure grays (all channels within 10 of each other AND in the dull range)
        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        if (spread < 12 && r > 30 && r < 230) return true;
        return false;
      };

      // Frequency-based color collection
      const colorFrequency = new Map<string, number>();
      const brandColorFrequency = new Map<string, number>(); // Higher priority from branded elements
      const fonts = new Set<string>();

      // Phase 1: Collect colors from ALL elements with frequency
      const allEls = [
        document.body,
        ...Array.from(
          document.querySelectorAll(
            "h1,h2,h3,h4,h5,h6,button,a,[role='button'],nav,header,footer,p,span,div,section,article,main"
          )
        ),
      ].slice(0, 300);

      for (const el of allEls) {
        try {
          const cs = window.getComputedStyle(el);
          const bg = cs.backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            const hex = rgb2hex(bg);
            if (!isStructuralColor(hex)) {
              colorFrequency.set(hex, (colorFrequency.get(hex) || 0) + 1);
            }
          }
          const textColor = cs.color;
          if (textColor) {
            const hex = rgb2hex(textColor);
            if (!isStructuralColor(hex)) {
              colorFrequency.set(hex, (colorFrequency.get(hex) || 0) + 1);
            }
          }
          if (cs.fontFamily) {
            fonts.add(
              cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim()
            );
          }
        } catch {
          /* skip inaccessible elements */
        }
      }

      // Phase 2: PRIORITIZE colors from branded elements (buttons, links, CTAs, brand-specific)
      const brandEls = Array.from(
        document.querySelectorAll(
          "button, a, [role='button'], [class*='btn'], [class*='cta'], [class*='brand'], [class*='primary'], [class*='accent'], [class*='highlight'], nav a, header a, .hero, [class*='hero']"
        )
      ).slice(0, 100);

      for (const el of brandEls) {
        try {
          const cs = window.getComputedStyle(el);
          const bg = cs.backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            const hex = rgb2hex(bg);
            if (!isStructuralColor(hex)) {
              brandColorFrequency.set(hex, (brandColorFrequency.get(hex) || 0) + 3); // 3x weight
            }
          }
          const textColor = cs.color;
          if (textColor) {
            const hex = rgb2hex(textColor);
            if (!isStructuralColor(hex)) {
              brandColorFrequency.set(hex, (brandColorFrequency.get(hex) || 0) + 2); // 2x weight
            }
          }
          // Also check border-color on buttons
          const borderColor = cs.borderColor;
          if (borderColor && borderColor !== "rgba(0, 0, 0, 0)" && borderColor !== "transparent") {
            const hex = rgb2hex(borderColor);
            if (!isStructuralColor(hex)) {
              brandColorFrequency.set(hex, (brandColorFrequency.get(hex) || 0) + 1);
            }
          }
        } catch { /* skip */ }
      }

      // Phase 3: Read CSS custom properties from :root
      try {
        const rootStyles = window.getComputedStyle(document.documentElement);
        const sheet = document.styleSheets;
        for (let i = 0; i < sheet.length; i++) {
          try {
            const rules = sheet[i].cssRules;
            for (let j = 0; j < rules.length; j++) {
              const rule = rules[j] as CSSStyleRule;
              if (rule.selectorText === ":root" || rule.selectorText === "html") {
                const text = rule.cssText;
                const varMatches = text.matchAll(/--([\w-]*):\s*(#[0-9a-fA-F]{3,8})/g);
                for (const match of varMatches) {
                  const varName = match[1].toLowerCase();
                  const hex = match[2];
                  if (!isStructuralColor(hex)) {
                    // CSS variables with brand/primary/accent in name get highest priority
                    const weight = (varName.includes("primary") || varName.includes("brand") || varName.includes("accent")) ? 5 : 1;
                    brandColorFrequency.set(hex, (brandColorFrequency.get(hex) || 0) + weight);
                  }
                }
              }
            }
          } catch { /* CORS blocked stylesheets */ }
        }
      } catch { /* skip */ }

      // Merge and sort: brand colors get priority, then by overall frequency
      const mergedScores = new Map<string, number>();
      for (const [hex, count] of colorFrequency) { mergedScores.set(hex, count); }
      for (const [hex, count] of brandColorFrequency) { mergedScores.set(hex, (mergedScores.get(hex) || 0) + count); }

      const sortedColors = Array.from(mergedScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([hex]) => hex);

      // Logo detection — multi-strategy
      let logoUrl = "";
      // Strategy 1: <img> with logo in src/alt/class/id
      const logoImgs = Array.from(document.querySelectorAll("img")).filter(
        (img) => {
          const s = (img.src + img.alt + img.className + img.id).toLowerCase();
          return s.includes("logo") || s.includes("brand") || s.includes("mark");
        }
      );
      if (logoImgs.length > 0) {
        logoUrl = logoImgs[0].src;
      }
      // Strategy 2: SVG logo inside header/nav
      if (!logoUrl) {
        const headerSvg = document.querySelector("header svg, nav svg, [class*='logo'] svg");
        if (headerSvg) {
          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(headerSvg);
          logoUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
        }
      }
      // Strategy 3: <link rel="icon">
      if (!logoUrl) {
        const icon = document.querySelector(
          'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
        );
        if (icon) logoUrl = (icon as HTMLLinkElement).href;
      }
      // Strategy 4: og:image
      if (!logoUrl) {
        const og = document.querySelector('meta[property="og:image"]');
        if (og) logoUrl = (og as HTMLMetaElement).content;
      }

      // ── SMART POMELLI-STYLE BRAND IMAGE COLLECTION ──
      const seenSrcs = new Set<string>();
      const images: string[] = [];
      const MAX_IMAGES = 24; // Less is more, high quality only

      const isUnwanted = (url: string) => {
        const s = url.toLowerCase();
        return s.includes("icon") || 
               s.includes("avatar") || 
               s.includes("badge") || 
               s.includes("logo") || // We have the main logo, don't want footer versions
               s.includes("partner") || 
               s.includes("sponsor") || 
               s.includes("pattern") ||
               s.includes("profile") ||
               s.endsWith(".svg"); // SVGs rarely look good in a photo grid
      };

      const isValidImageUrl = (src: string) => {
        if (!src || seenSrcs.has(src)) return false;
        if (src.startsWith("data:image/svg")) return false; // skip tiny SVG data URIs
        if (src.startsWith("data:image/gif;base64,R0lGODlhAQAB")) return false; // 1x1 tracking pixel
        if (src.startsWith("data:image/") && src.length < 5000) return false; // skip tiny base64 UI elements
        if (isUnwanted(src)) return false;
        return src.startsWith("http") || src.startsWith("//") || src.startsWith("data:image");
      };

      const addImage = (src: string) => {
        if (images.length >= MAX_IMAGES) return;
        const normalized = src.startsWith("//") ? "https:" + src : src;
        if (!seenSrcs.has(normalized)) {
          seenSrcs.add(normalized);
          images.push(normalized);
        }
      };

      // Source 1: All <img> tags — strict size/aspect ratio filtering
      for (const img of Array.from(document.querySelectorAll("img"))) {
        // Measure real rendering size if naturalWidth isn't available
        const rect = img.getBoundingClientRect();
        const w = img.naturalWidth || img.width || rect.width;
        const h = img.naturalHeight || img.height || rect.height;
        
        const className = img.className || "";
        const alt = img.getAttribute("alt") || "";
        if (isUnwanted(className + " " + alt)) continue;

        // Require substantial dimensions (brand photos/product shots)
        if (w > 0 && w < 150) continue; // Ignore small 
        if (h > 0 && h < 100) continue; // Ignore thin
        
        // Exclude extreme aspect ratios like long thin dividers
        if (w > 0 && h > 0) {
          const ratio = w / h;
          if (ratio > 4 || ratio < 0.25) continue; 
        }

        const candidates = [
          img.src,
          img.getAttribute("data-src"),
          img.getAttribute("data-lazy-src"),
          img.getAttribute("data-original"),
          img.getAttribute("data-lazy"),
        ];
        
        let foundValid = false;
        for (const src of candidates) {
          if (src && isValidImageUrl(src)) {
            addImage(src);
            foundValid = true;
            break;
          }
        }
        
        if (!foundValid) {
          // Source 2: srcset attribute — grab the largest resolution if standard src wasn't valid
          const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
          if (srcset) {
            const parts = srcset.split(",").map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
            const best = parts[parts.length - 1]; // largest
            if (best && isValidImageUrl(best)) {
              addImage(best);
            }
          }
        }
      }

      // Source 3: <picture> / <source> elements
      for (const source of Array.from(document.querySelectorAll("picture source"))) {
        const srcset = source.getAttribute("srcset") || "";
        const parts = srcset.split(",").map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
        for (const src of parts) {
          if (isValidImageUrl(src)) addImage(src);
        }
      }

      // Source 4: CSS background-image on visible elements
      const bgEls = Array.from(document.querySelectorAll(
        "div, section, header, footer, article, aside, main, [class*='hero'], [class*='banner'], [class*='bg'], [class*='image'], [class*='photo'], [class*='cover'], [style*='background']"
      )).slice(0, 300);

      for (const el of bgEls) {
        try {
          const cs = window.getComputedStyle(el);
          const bgImg = cs.backgroundImage;
          if (bgImg && bgImg !== "none") {
            // Extract all url(...) from the background-image property
            const urlMatches = bgImg.matchAll(/url\(["']?(.*?)["']?\)/g);
            for (const match of urlMatches) {
              const src = match[1];
              if (isValidImageUrl(src)) addImage(src);
            }
          }
        } catch {
          /* ignored */
        }
      }

      // Source 5: <video> poster attribute
      for (const video of Array.from(document.querySelectorAll("video[poster]"))) {
        const poster = video.getAttribute("poster");
        if (poster && isValidImageUrl(poster)) addImage(poster);
      }

      // Source 6: og:image, twitter:image meta tags
      for (const meta of Array.from(document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"], meta[name="twitter:image:src"]'))) {
        const content = (meta as HTMLMetaElement).content;
        if (content && isValidImageUrl(content)) addImage(content);
      }

      // Text content
      const textEls = Array.from(
        document.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,[class*='hero'],[class*='tagline'],[class*='description'],[class*='subtitle']")
      );
      const textSample = textEls
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join(" ")
        .slice(0, 3000);

      return {
        colors: sortedColors.slice(0, 20),
        fonts: Array.from(fonts).slice(0, 10),
        logoUrl,
        images,
        textSample,
        pageTitle: document.title,
      };
    });

    // ── LEVEL-1 PAGE SCRAPING ──────────────────────────────
    // Discover internal links from the homepage and scrape up to 5 for richer data
    const level1Links = await page.evaluate((baseUrl: string) => {
      const origin = new URL(baseUrl).origin;
      const seen = new Set<string>();
      const priorityKeywords = ["about", "product", "service", "mission", "story", "team", "value", "who-we-are", "our-story", "features", "solutions"];
      const links: { href: string; priority: number }[] = [];
      
      for (const a of Array.from(document.querySelectorAll("a[href]"))) {
        const href = (a as HTMLAnchorElement).href;
        if (!href.startsWith(origin)) continue;
        if (href === baseUrl || href === baseUrl + "/") continue;
        if (seen.has(href)) continue;
        if (href.includes("#") || href.includes("?") || href.includes("login") || href.includes("signup") || href.includes("cart") || href.includes("checkout")) continue;
        seen.add(href);
        const lowerHref = href.toLowerCase();
        const priority = priorityKeywords.some(kw => lowerHref.includes(kw)) ? 1 : 2;
        links.push({ href, priority });
      }
      return links.sort((a, b) => a.priority - b.priority).slice(0, 5).map(l => l.href);
    }, url);

    console.log(`[extract-dna] Found ${level1Links.length} level-1 pages to scrape`);

    let level1Text = "";
    const level1Images: string[] = [];

    for (const link of level1Links) {
      try {
        const subPage = await context.newPage();
        await subPage.goto(link, { waitUntil: "domcontentloaded", timeout: 10000 });
        await subPage.waitForTimeout(1000);
        
        const subData = await subPage.evaluate(() => {
          const textEls = Array.from(document.querySelectorAll("h1,h2,h3,h4,p,li,blockquote"));
          const text = textEls.map(el => el.textContent?.trim()).filter(Boolean).join(" ").slice(0, 1500);
          
          const imgs: string[] = [];
          for (const img of Array.from(document.querySelectorAll("img"))) {
            const rect = img.getBoundingClientRect();
            const w = img.naturalWidth || rect.width;
            const h = img.naturalHeight || rect.height;
            if (w < 150 || h < 100) continue;
            if (img.src && img.src.startsWith("http") && !img.src.toLowerCase().includes("icon") && !img.src.toLowerCase().includes("logo")) {
              imgs.push(img.src);
            }
          }
          return { text, images: imgs.slice(0, 5) };
        });
        
        level1Text += " " + subData.text;
        level1Images.push(...subData.images);
        await subPage.close();
      } catch {
        console.warn(`[extract-dna] Failed to scrape level-1 page: ${link}`);
      }
    }

    await browser.close();
    browser = null;

    // Merge level-1 data
    extractionPayload.textSample += " " + level1Text;
    extractionPayload.textSample = extractionPayload.textSample.slice(0, 5000);
    // Deduplicate and merge images
    const allImages = [...extractionPayload.images, ...level1Images];
    extractionPayload.images = Array.from(new Set(allImages)).slice(0, 24);

    console.log(
      "[extract-dna] Scrape done. Colors:",
      extractionPayload.colors.length,
      "Fonts:",
      extractionPayload.fonts.length,
      "Images:",
      extractionPayload.images.length,
      "Level-1 pages scraped:",
      level1Links.length
    );

    // ── 2. CHECK GEMINI API KEY ──────────────────────────────
    if (!apiKey) {
      console.warn("[extract-dna] No GEMINI_API_KEY set. Returning smart scrape data.");
      const brandName = extractionPayload.pageTitle.split("|")[0].split("-")[0].split("—")[0].trim() || "Unknown";
      // Extract tagline from first H1 text
      const sentences = extractionPayload.textSample.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 80);
      const tagline = sentences[0] || "";
      // Build overview from the first few meaningful sentences  
      const overview = sentences.slice(0, 3).join(". ").slice(0, 300) + (sentences.length > 3 ? "." : "");
      const fallback = {
        brandName,
        logoUrl: extractionPayload.logoUrl,
        colors: {
          primary: extractionPayload.colors[0] || "#6366f1",
          secondary: extractionPayload.colors[1] || "#22d3ee",
          tertiary: extractionPayload.colors[2] || "#f59e0b",
          quaternary: extractionPayload.colors[3] || "#ef4444",
        },
        typography: {
          headingFont: extractionPayload.fonts[0] || "Inter",
          bodyFont: extractionPayload.fonts[1] || extractionPayload.fonts[0] || "Inter",
        },
        tagline,
        brandValue: "Quality, Innovation, Trust",
        brandAesthetic: "Modern, Clean, Professional",
        toneOfVoice: "Confident, Approachable, Clear",
        businessOverview: overview || `${brandName} is a business dedicated to delivering value through their products and services.`,
        images: extractionPayload.images,
      };
      return NextResponse.json({ dna: fallback, screenshot: screenshotBase64 });
    }

    // ── 3. GEMINI LLM PROCESSING (with model fallback) ──────────
    const prompt = `You are a senior Brand Strategist at a world-class branding agency. Your task is to produce a comprehensive "Business DNA" profile for the company at ${normalizeUrl(rawUrl)}.

You have TWO sources of intelligence:
1. SCRAPED WEBSITE DATA (provided below)
2. YOUR OWN WORLD KNOWLEDGE about this company, its industry, parent company, history, campaigns, and public positioning

ALWAYS combine both sources. The scraped data gives you live website signals (colors, fonts, current copy). Your world knowledge fills in the strategic depth (parent company, market position, social initiatives, famous campaigns, actual taglines).

--- SCRAPED WEBSITE DATA ---
Page Title: ${extractionPayload.pageTitle}
CSS Colors Found (sorted by prominence): ${extractionPayload.colors.join(", ")}
CSS Fonts Found: ${extractionPayload.fonts.join(", ")}
Website Text Content:
"${extractionPayload.textSample}"
---

Produce the following with EXPERT-LEVEL precision:

1. "brandName": The clean brand name only (e.g., "Ariel" not "Ariel India | P&G").

2. "colors": Pick exactly 4 distinctive brand colors from the CSS list that define this brand's visual identity. NEVER use pure white (#ffffff) or pure black (#000000). If the CSS list has fewer than 4 real brand colors, use your knowledge of this brand's actual color palette to fill the remaining slots with accurate hex values.

3. "typography": Identify heading and body fonts from the CSS fonts list. Clean up names (remove "sans-serif", quotes, etc.).

4. "tagline": Find the brand's most iconic, customer-facing tagline or slogan. This should be their actual marketing tagline (e.g., "Ariel removes tough stains in 1 wash", "Just Do It", "Think Different"). Look for it in the website text first. If not found, use your world knowledge of their real tagline. This must feel like a marketing headline, NOT a generic description.

5. "brandValue": A comma-separated list of 3-5 deeply researched core values that reflect what this specific brand truly stands for. Be contextual and specific to THIS brand — not generic business values. Examples of GOOD specificity:
   - Ariel: "Innovation, Gender Equality, Sustainability, Trust"
   - Nike: "Athletic Excellence, Inclusivity, Determination, Self-Expression"
   - Apple: "Privacy, Simplicity, Innovation, Premium Craftsmanship"
   Do NOT return generic values like "Quality, Service, Growth" — dig deeper.

6. "brandAesthetic": A comma-separated list of 4-6 visual/design descriptors that capture how this brand LOOKS and FEELS. Be creative and brand-specific. Examples of GOOD specificity:
   - Ariel: "modern, clean, radiant, minimalist, scientific, eco-fresh"
   - Nike: "bold, athletic, high-contrast, kinetic, aspirational"
   - Apple: "minimal, premium, spacious, monochromatic, refined"

7. "toneOfVoice": A comma-separated list of 3-5 communication personality descriptors. How does this brand SPEAK to its audience? Examples of GOOD specificity:
   - Ariel: "Expert, Helpful, Empowering, Socially conscious"
   - Nike: "Motivational, Bold, Inclusive, Direct"
   - Apple: "Confident, Simple, Aspirational, Understated"

8. "businessOverview": Write exactly 2-3 polished sentences (40-70 words) that a brand strategist would write. Mention: what the company does, who owns it (if subsidiary), key product categories, and any notable initiatives or positioning. Example quality:
   "Ariel is a global laundry detergent brand by Procter & Gamble that offers a comprehensive range of powders, liquids, and 4-in-1 PODS. The brand focuses on advanced stain removal technology while promoting domestic gender equality through its long-running #ShareTheLoad movement and providing extensive laundry education."

Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "brandName": "string",
  "logoUrl": "${extractionPayload.logoUrl}",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "tertiary": "#hex",
    "quaternary": "#hex"
  },
  "typography": {
    "headingFont": "font name",
    "bodyFont": "font name"
  },
  "tagline": "their actual marketing tagline",
  "brandValue": "Value1, Value2, Value3, Value4",
  "brandAesthetic": "descriptor1, descriptor2, descriptor3, descriptor4, descriptor5, descriptor6",
  "toneOfVoice": "tone1, tone2, tone3, tone4",
  "businessOverview": "2-3 expert sentences",
  "images": []
}`;

    // Try multiple models in case one hits quota
    const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
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

    // If ALL models failed, handle gracefully
    if (!aiText) {
      if (lastGeminiError.includes("429") || lastGeminiError.includes("quota")) {
        console.error("[extract-dna] Gemini API Quota Exceeded.");
        return NextResponse.json({ 
          error: "Gemini API rate limit exceeded. You are testing too fast! Please wait 60 seconds and try again to see the ScaleSoci-grade AI results." 
        }, { status: 429 });
      }

      console.warn("[extract-dna] All Gemini models failed for unknown reason. Returning smart scrape fallback.");
      const brandName = extractionPayload.pageTitle.split("|")[0].split("-")[0].split("—")[0].trim() || "Unknown";
      const sentences = extractionPayload.textSample.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 80);
      const tagline = sentences[0] || "";
      const overview = sentences.slice(0, 3).join(". ").slice(0, 300) + (sentences.length > 3 ? "." : "");
      const fallbackDna = {
        brandName,
        logoUrl: extractionPayload.logoUrl,
        colors: {
          primary: extractionPayload.colors[0] || "#6366f1",
          secondary: extractionPayload.colors[1] || "#22d3ee",
          tertiary: extractionPayload.colors[2] || "#f59e0b",
          quaternary: extractionPayload.colors[3] || "#ef4444",
        },
        typography: {
          headingFont: extractionPayload.fonts[0] || "Inter",
          bodyFont: extractionPayload.fonts[1] || extractionPayload.fonts[0] || "Inter",
        },
        tagline,
        brandValue: "Quality, Innovation, Trust",
        brandAesthetic: "Modern, Clean, Professional",
        toneOfVoice: "Confident, Approachable, Clear",
        businessOverview: overview || `${brandName} is a business dedicated to delivering value through their products and services.`,
        images: extractionPayload.images,
      };
      return NextResponse.json({ dna: fallbackDna, screenshot: screenshotBase64 });
    }

    let parsedDna;
    try {
      // Strip markdown code blocks just in case the LLM ignored strict JSON instructions
      const cleanedJson = aiText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
      parsedDna = JSON.parse(cleanedJson);
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
    return NextResponse.json({ dna: parsedDna, screenshot: screenshotBase64 });

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
