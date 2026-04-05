import { NextResponse } from "next/server";
import { chromium, Browser, Page } from "playwright";
import { GoogleGenAI } from "@google/genai";

// ────────────────────────────────────────────────────────────────
// UTILITY
// ────────────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
  return u;
}

function isUsefulImage(src: string): boolean {
  if (!src || src.length < 10) return false;
  const lower = src.toLowerCase();
  const junk = [
    "pixel", "track", "analytics", "beacon", "1x1", "spacer",
    "facebook.com/tr", "google-analytics", "doubleclick",
    "googletagmanager", "hotjar", ".gif", "data:image/gif",
    "data:image/svg+xml", "gravatar", "wp-emoji",
    "wpcf7", "spinner", "loading.gif", "placeholder",
  ];
  if (junk.some((j) => lower.includes(j))) return false;
  if (lower.endsWith(".ico") && !lower.includes("logo")) return false;
  // Skip very short path segments that look like icons/favicons  
  if (/\/(icon|favicon|sprite|arrow|chevron|check|star|dot|close|menu|hamburger)/i.test(lower)) return false;
  return true;
}

// Normalize image URL to detect duplicates from srcset variants
// e.g. image-300x200.jpg and image-1200x800.jpg → same base image
function normalizeImageUrl(src: string): string {
  try {
    const u = new URL(src);
    // Remove common CDN size params
    ["w", "h", "width", "height", "size", "q", "quality", "fit", "resize", "scale", "format", "auto", "fm"].forEach((p) => u.searchParams.delete(p));
    // Strip WP-style dimension suffixes: -300x200, _300x200, @2x, -scaled, -large, -medium, -small, -thumbnail
    let path = u.pathname
      .replace(/-\d+x\d+(\.[a-zA-Z]+)$/, "$1")       // -300x200.jpg
      .replace(/_\d+x\d+(\.[a-zA-Z]+)$/, "$1")       // _300x200.jpg
      .replace(/@[0-9.]+x(\.[a-zA-Z]+)$/, "$1")      // @2x.png
      .replace(/-(scaled|large|medium|small|thumbnail|full|crop)(\.[a-zA-Z]+)$/, "$2") // -scaled.jpg
      .replace(/\/(w_\d+|h_\d+|c_\w+|f_\w+|q_\w+),?/g, "/"); // Cloudinary segments
    u.pathname = path;
    return u.origin + u.pathname; // Drop query entirely for dedup key
  } catch {
    return src;
  }
}

// ────────────────────────────────────────────────────────────────
// DEEP PAGE SCRAPER
// ────────────────────────────────────────────────────────────────

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight || totalHeight > 8000) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 150);
    });
  });
}

async function dismissPopups(page: Page) {
  const selectors = [
    // Cookie banners
    'button[id*="accept"]', 'button[id*="cookie"]', 'button[class*="accept"]',
    'button[class*="cookie"]', 'a[id*="accept"]', '[data-testid*="accept"]',
    'button[aria-label*="Accept"]', 'button[aria-label*="accept"]',
    'button[aria-label*="Close"]', 'button[aria-label*="close"]',
    'button[aria-label*="Dismiss"]',
    // Generic close buttons on overlays
    '.modal-close', '.popup-close', '[class*="close-button"]',
    '[class*="dismiss"]', '[class*="consent"] button',
    '#onetrust-accept-btn-handler',
    '.cc-dismiss', '.cc-allow',
  ];
  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 300 })) {
        await btn.click({ timeout: 500 });
        await page.waitForTimeout(300);
      }
    } catch { /* expected — most won't exist */ }
  }
}

async function scrapePage(page: Page) {
  return page.evaluate(() => {
    // ── Helpers ──
    const rgb2hex = (rgb: string) => {
      const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return rgb;
      return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n, 10).toString(16).padStart(2, "0")).join("");
    };

    const seenSrcs = new Set<string>();
    const images: string[] = [];
    const addImg = (src: string | null | undefined) => {
      if (!src) return;
      let s = src.trim();
      if (s.startsWith("//")) s = "https:" + s;
      if (s && !seenSrcs.has(s) && s.startsWith("http")) {
        seenSrcs.add(s);
        images.push(s);
      }
    };

    // ── LOGO — 10-strategy detection ──
    let logoUrl = "";

    // 1. <img> or <svg> inside <header>, <nav>, or first section with logo/brand class/id/alt
    const headerAreas = document.querySelectorAll("header, nav, [class*='header'], [class*='navbar'], [id*='header'], [id*='nav']");
    for (const area of Array.from(headerAreas)) {
      if (logoUrl) break;
      // Check img inside header
      const imgs = area.querySelectorAll("img");
      for (const img of Array.from(imgs)) {
        const combined = (img.src + img.alt + img.className + img.id).toLowerCase();
        if (combined.includes("logo") || combined.includes("brand") || img.closest("a[href='/']") || img.closest("a[href='./']")) {
          logoUrl = img.src || img.getAttribute("data-src") || "";
          break;
        }
      }
      // Check SVG inside header that might be a logo
      if (!logoUrl) {
        const svgs = area.querySelectorAll("svg");
        for (const svg of Array.from(svgs)) {
          const parent = svg.closest("a");
          if (parent && (parent.getAttribute("href") === "/" || parent.getAttribute("href") === "./")) {
            // It's an SVG logo linked to home — serialize it as data URI
            const svgStr = new XMLSerializer().serializeToString(svg);
            logoUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
            break;
          }
          const cls = (svg.getAttribute("class") || "") + (svg.getAttribute("id") || "");
          if (cls.toLowerCase().includes("logo")) {
            const svgStr = new XMLSerializer().serializeToString(svg);
            logoUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
            break;
          }
        }
      }
    }

    // 2. Any <img> on page with "logo" in src/alt/class/id
    if (!logoUrl) {
      const allImgs = document.querySelectorAll("img");
      for (const img of Array.from(allImgs)) {
        const combined = (img.src + img.alt + img.className + img.id + (img.getAttribute("data-src") || "")).toLowerCase();
        if (combined.includes("logo") || combined.includes("brand-mark")) {
          logoUrl = img.src || img.getAttribute("data-src") || "";
          break;
        }
      }
    }

    // 3. First image inside a link to homepage
    if (!logoUrl) {
      const homeLinks = document.querySelectorAll('a[href="/"], a[href="./"], a[href*="index"]');
      for (const link of Array.from(homeLinks)) {
        const img = link.querySelector("img");
        if (img && img.src) { logoUrl = img.src; break; }
      }
    }

    // 4. apple-touch-icon
    if (!logoUrl) {
      const apple = document.querySelector('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]');
      if (apple) logoUrl = (apple as HTMLLinkElement).href;
    }

    // 5. OG image
    if (!logoUrl) {
      const og = document.querySelector('meta[property="og:image"]');
      if (og) logoUrl = (og as HTMLMetaElement).content;
    }

    // 6. Favicon
    if (!logoUrl) {
      const icon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
      if (icon) logoUrl = (icon as HTMLLinkElement).href;
    }

    // 7. manifest.json icons (just get the href for now)
    if (!logoUrl) {
      const manifest = document.querySelector('link[rel="manifest"]');
      if (manifest) {
        // We'll handle this on the server side
        logoUrl = "__MANIFEST__:" + (manifest as HTMLLinkElement).href;
      }
    }

    // ── IMAGES — aggressive multi-source capture ──

    // Strategy 1: All <img> tags with every lazy-load attribute variant
    const lazyAttrs = ["src", "data-src", "data-lazy-src", "data-original", "data-srcset",
      "data-lazy", "data-image", "data-bg", "data-full", "data-hi-res", "loading-src"];
    for (const img of Array.from(document.querySelectorAll("img"))) {
      for (const attr of lazyAttrs) {
        const val = img.getAttribute(attr);
        if (val && val.startsWith("http")) addImg(val);
        else if (val && val.startsWith("//")) addImg("https:" + val);
        else if (val && val.startsWith("/") && !val.startsWith("//")) {
          try { addImg(new URL(val, document.baseURI).href); } catch { /* skip */ }
        }
      }
      // srcset — pick the best (last/largest) resolution
      const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset");
      if (srcset) {
        const candidates = srcset.split(",").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
        candidates.forEach((c) => {
          try { addImg(new URL(c, document.baseURI).href); } catch { addImg(c); }
        });
      }
    }

    // Strategy 2: <picture> > <source>
    for (const source of Array.from(document.querySelectorAll("picture source"))) {
      const srcset = source.getAttribute("srcset");
      if (srcset) {
        srcset.split(",").forEach((entry) => {
          const url = entry.trim().split(/\s+/)[0];
          try { addImg(new URL(url, document.baseURI).href); } catch { addImg(url); }
        });
      }
    }

    // Strategy 3: <video> poster images
    for (const video of Array.from(document.querySelectorAll("video[poster]"))) {
      addImg(video.getAttribute("poster"));
    }

    // Strategy 4: CSS background-image on up to 300 elements
    const allEls = [
      document.body,
      ...Array.from(document.querySelectorAll(
        "header,footer,nav,main,section,article,aside,div,span,a,button,figure,h1,h2,h3,h4,h5,h6,p,[class*='hero'],[class*='banner'],[class*='slide'],[class*='bg'],[class*='image'],[class*='thumb'],[class*='card'],[class*='cover'],[class*='feature'],[style*='background']"
      )),
    ].slice(0, 300);

    const colors = new Set<string>();
    const fonts = new Set<string>();

    for (const el of allEls) {
      try {
        const cs = window.getComputedStyle(el);
        // Colors
        const bg = cs.backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") colors.add(rgb2hex(bg));
        const clr = cs.color;
        if (clr) colors.add(rgb2hex(clr));
        const border = cs.borderColor;
        if (border && border !== "rgba(0, 0, 0, 0)" && border !== "transparent" && border !== "rgb(0, 0, 0)") {
          colors.add(rgb2hex(border));
        }

        // Fonts
        if (cs.fontFamily) {
          const primary = cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
          if (primary && primary !== "inherit" && primary !== "initial") fonts.add(primary);
        }

        // Background images
        const bgImg = cs.backgroundImage;
        if (bgImg && bgImg !== "none") {
          const matches = bgImg.matchAll(/url\(["']?(.*?)["']?\)/g);
          for (const m of matches) {
            if (m[1] && !m[1].startsWith("data:image/svg") && !m[1].startsWith("data:image/gif")) {
              try { addImg(new URL(m[1], document.baseURI).href); } catch { addImg(m[1]); }
            }
          }
        }
      } catch { /* skip */ }
    }

    // Strategy 5: Inline style background-image attributes
    for (const el of Array.from(document.querySelectorAll("[style*='background']"))) {
      const style = el.getAttribute("style") || "";
      const matches = style.matchAll(/url\(["']?(.*?)["']?\)/g);
      for (const m of matches) {
        try { addImg(new URL(m[1], document.baseURI).href); } catch { addImg(m[1]); }
      }
    }

    // Strategy 6: <figure>, <a> with image extensions in href
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const href = (a as HTMLAnchorElement).href;
      if (/\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(href)) addImg(href);
    }

    // ── TEXT — structured extraction ──
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";

    // Gather text from semantic elements, ordered by importance
    const textParts: string[] = [];
    if (ogTitle) textParts.push(ogTitle);
    if (metaDesc) textParts.push(metaDesc);
    if (ogDesc && ogDesc !== metaDesc) textParts.push(ogDesc);

    const contentSelectors = [
      "h1", "h2", "h3", "h4",
      "[class*='hero'] p", "[class*='hero'] h1", "[class*='hero'] h2",
      "[class*='tagline']", "[class*='slogan']", "[class*='headline']",
      "[class*='subtitle']", "[class*='description']",
      "main p", "article p", "section p",
      "p", "li", "blockquote", "figcaption",
      "[class*='feature'] h3", "[class*='feature'] p",
      "[class*='about'] p", "[class*='mission'] p",
      "footer p",
    ];
    for (const sel of contentSelectors) {
      for (const el of Array.from(document.querySelectorAll(sel))) {
        const t = el.textContent?.trim();
        if (t && t.length > 5 && !textParts.includes(t)) textParts.push(t);
      }
    }

    // JSON-LD structured data
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(jsonLd)) {
      try {
        const data = JSON.parse(script.textContent || "");
        if (data.description) textParts.push(data.description);
        if (data.name) textParts.push(data.name);
        if (data.slogan) textParts.push(data.slogan);
      } catch { /* skip */ }
    }

    const textSample = textParts.join(" | ").slice(0, 5000);

    // ── INTERNAL LINKS — crawl ALL level-1 navigation links ──
    const baseHostname = window.location.hostname;
    const seenPaths = new Set<string>([window.location.pathname]);
    const internalLinks: string[] = [];
    const skipPatterns = ["login", "signin", "signup", "register", "cart", "checkout", "account", "privacy", "terms", "cookie", "legal", "#", "mailto:", "tel:", "javascript:"];

    // Strategy 1: ALL links inside nav/header (primary navigation)
    const navAreas = document.querySelectorAll("nav, header, [role='navigation'], [class*='nav'], [class*='menu']");
    for (const area of Array.from(navAreas)) {
      for (const a of Array.from(area.querySelectorAll("a[href]"))) {
        try {
          const href = new URL((a as HTMLAnchorElement).href, document.baseURI);
          const path = href.pathname.toLowerCase();
          if (href.hostname === baseHostname && !seenPaths.has(href.pathname) && path !== "/") {
            if (!skipPatterns.some((s) => path.includes(s) || href.href.includes(s))) {
              seenPaths.add(href.pathname);
              internalLinks.push(href.href);
            }
          }
        } catch { /* skip */ }
      }
    }

    // Strategy 2: Any remaining same-domain links with useful paths (backup)
    if (internalLinks.length < 6) {
      for (const a of Array.from(document.querySelectorAll("a[href]"))) {
        if (internalLinks.length >= 8) break;
        try {
          const href = new URL((a as HTMLAnchorElement).href, document.baseURI);
          const path = href.pathname.toLowerCase();
          if (href.hostname === baseHostname && !seenPaths.has(href.pathname) && path !== "/" && path.split("/").length <= 3) {
            if (!skipPatterns.some((s) => path.includes(s) || href.href.includes(s))) {
              seenPaths.add(href.pathname);
              internalLinks.push(href.href);
            }
          }
        } catch { /* skip */ }
      }
    }

    return {
      colors: Array.from(colors).filter((c) => c.startsWith("#")).slice(0, 25),
      fonts: Array.from(fonts).slice(0, 8),
      logoUrl,
      images: images.slice(0, 50),
      textSample,
      pageTitle: document.title,
      internalLinks: internalLinks.slice(0, 4),
    };
  });
}

// ────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  let genAI: GoogleGenAI | null = null;
  if (apiKey) genAI = new GoogleGenAI({ apiKey });

  let browser: Browser | null = null;

  try {
    const body = await req.json();
    const rawUrl = body?.url;
    if (!rawUrl) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const url = normalizeUrl(rawUrl);
    console.log("[extract-dna] 🚀 Starting deep extraction for:", url);

    // ══════════════════════════════════════════════════════════
    // PHASE 1 — DEEP PLAYWRIGHT SCRAPE
    // ══════════════════════════════════════════════════════════
    let textSample = "";
    let extractedColors: string[] = [];
    let extractedFonts: string[] = [];
    let extractedLogo = "";
    let extractedImages: string[] = [];
    let pageTitle = "";

    try {
      browser = await chromium.launch({
        headless: true,
        args: ["--disable-blink-features=AutomationControlled"],
      });

      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        viewport: { width: 1440, height: 900 },
        extraHTTPHeaders: {
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        },
        javaScriptEnabled: true,
        bypassCSP: true,
      });

      // Block heavy non-essential resources
      await context.route("**/*.{mp4,webm,ogg,mp3,wav,flac,woff2,woff,ttf,eot}", (route) => route.abort());

      const page = await context.newPage();

      // Navigate to main page
      console.log("[extract-dna] 📄 Loading main page...");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

      // Wait for lazy-loaded content & JS rendering
      try { await page.waitForLoadState("networkidle", { timeout: 8000 }); } catch { /* timeout is ok */ }

      // Dismiss cookie banners / popups
      await dismissPopups(page);

      // Auto-scroll to trigger lazy loading
      console.log("[extract-dna] 📜 Scrolling to trigger lazy images...");
      await autoScroll(page);
      await page.waitForTimeout(1500);

      // Scrape the main page
      const mainData = await scrapePage(page);

      extractedColors = mainData.colors;
      extractedFonts = mainData.fonts;
      extractedLogo = mainData.logoUrl;
      extractedImages = [...mainData.images];
      textSample = mainData.textSample;
      pageTitle = mainData.pageTitle;

      console.log(`[extract-dna] ✅ Main page: ${extractedImages.length} images, ${extractedColors.length} colors, ${extractedFonts.length} fonts`);

      // ── CRAWL INTERNAL PAGES (About, Products, etc.) ──
      const internalLinks = mainData.internalLinks;
      if (internalLinks.length > 0) {
        console.log(`[extract-dna] 🔗 Crawling ${internalLinks.length} internal pages:`, internalLinks);
        for (const link of internalLinks) {
          try {
            const subPage = await context.newPage();
            await subPage.goto(link, { waitUntil: "domcontentloaded", timeout: 12000 });
            try { await subPage.waitForLoadState("networkidle", { timeout: 5000 }); } catch { /* ok */ }
            await autoScroll(subPage);
            await subPage.waitForTimeout(800);

            const subData = await scrapePage(subPage);

            // Merge images (deduplicated)
            for (const img of subData.images) {
              if (!extractedImages.includes(img)) extractedImages.push(img);
            }
            // Merge text
            if (subData.textSample) {
              textSample += " | [" + link.split("/").pop() + "] " + subData.textSample;
            }
            // Merge colors
            for (const c of subData.colors) {
              if (!extractedColors.includes(c)) extractedColors.push(c);
            }

            await subPage.close();
            console.log(`[extract-dna]   ✅ ${link} — +${subData.images.length} images`);
          } catch (subErr) {
            console.warn(`[extract-dna]   ⚠ Failed to crawl ${link}:`, subErr);
          }
        }
      }

      // Handle manifest logo
      if (extractedLogo.startsWith("__MANIFEST__:")) {
        try {
          const manifestUrl = extractedLogo.replace("__MANIFEST__:", "");
          const manifestPage = await context.newPage();
          const resp = await manifestPage.goto(manifestUrl, { timeout: 5000 });
          const manifestJson = await resp?.json();
          if (manifestJson?.icons?.length > 0) {
            const bestIcon = manifestJson.icons[manifestJson.icons.length - 1];
            extractedLogo = new URL(bestIcon.src, manifestUrl).href;
          }
          await manifestPage.close();
        } catch {
          extractedLogo = "";
        }
      }

      await browser.close();
      browser = null;

    } catch (err: unknown) {
      console.warn("[extract-dna] ⚠ Playwright failed, using HTTP fallback...", err);
      if (browser) { try { await browser.close(); } catch { /* */ } browser = null; }

      // ── HTTP FETCH FALLBACK ──
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
          },
        });
        const html = await res.text();

        // Title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) pageTitle = titleMatch[1].trim();

        // Meta description
        const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
        const metaDesc = metaMatch ? metaMatch[1] : "";

        // Text
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ");
        textSample = (metaDesc + " | " + textContent).slice(0, 5000);

        // Images from HTML
        const imgRegex = /<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"']+)["']/gi;
        let match;
        while ((match = imgRegex.exec(html)) !== null && extractedImages.length < 30) {
          if (isUsefulImage(match[1])) extractedImages.push(match[1]);
        }

        // Background images from CSS
        const bgRegex = /background(?:-image)?:\s*url\(["']?(https?:\/\/[^"')]+)["']?\)/gi;
        while ((match = bgRegex.exec(html)) !== null && extractedImages.length < 40) {
          if (isUsefulImage(match[1])) extractedImages.push(match[1]);
        }

        // Colors from inline styles
        const colorRegex = /#([0-9a-fA-F]{3,8})\b/g;
        while ((match = colorRegex.exec(html)) !== null && extractedColors.length < 15) {
          const hex = "#" + match[1];
          if (hex.length === 4 || hex.length === 7) extractedColors.push(hex);
        }

        // Logo fallback from HTML
        const logoMatch = html.match(/<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)
          || html.match(/<img[^>]*src=["']([^"']*logo[^"']*)["']/i);
        if (logoMatch) extractedLogo = logoMatch[1];

      } catch (fbErr) {
        console.error("[extract-dna] HTTP fallback also failed:", fbErr);
      }
    }

    // ── POST-PROCESSING ──

    // Filter images for quality
    extractedImages = extractedImages.filter(isUsefulImage);
    
    // Deduplicate by normalized URL (strips dimension suffixes, CDN params)
    // Keep the ORIGINAL URL (not the normalized key) for display, but use normalized key for set membership
    const seenNormalized = new Set<string>();
    const deduped: string[] = [];
    // Sort by URL length descending — longer URLs tend to be higher resolution
    extractedImages.sort((a, b) => b.length - a.length);
    for (const img of extractedImages) {
      const key = normalizeImageUrl(img);
      if (!seenNormalized.has(key)) {
        seenNormalized.add(key);
        deduped.push(img);
      }
    }
    extractedImages = deduped.slice(0, 50);

    // Clearbit logo fallback
    if (!extractedLogo || !extractedLogo.startsWith("http")) {
      try {
        const domain = new URL(url).hostname;
        extractedLogo = `https://logo.clearbit.com/${domain}`;
        console.log("[extract-dna] 🔄 Using Clearbit fallback logo:", extractedLogo);
      } catch { /* */ }
    }

    // Trim text
    textSample = textSample.slice(0, 6000);

    console.log(`[extract-dna] 📊 Final scrape totals: ${extractedImages.length} images, ${extractedColors.length} colors, ${extractedFonts.length} fonts, ${textSample.length} chars text`);

    // ══════════════════════════════════════════════════════════
    // PHASE 2 — GEMINI LLM ENRICHMENT
    // ══════════════════════════════════════════════════════════

    if (!apiKey || !genAI) {
      console.warn("[extract-dna] No API key. Returning raw scrape data.");
      return NextResponse.json({
        dna: {
          brandName: pageTitle.split("|")[0].split("-")[0].split("—")[0].trim() || "Unknown",
          logoUrl: extractedLogo,
          colors: {
            primary: extractedColors[0] || "#333", secondary: extractedColors[1] || "#666",
            background: "#fff", textHighContrast: "#000", accent: extractedColors[2] || "#0066ff",
          },
          typography: { headingFont: extractedFonts[0] || "Inter", bodyFont: extractedFonts[1] || "Inter" },
          tagline: "", brandValue: "", brandAesthetic: "", toneOfVoice: "",
          businessOverview: textSample.slice(0, 300), images: extractedImages,
        },
      });
    }

    // ── DNA prompt ──
    const prompt = `You are an expert Brand Analyst and designer. Analyze this website: ${url}

SCRAPED DATA:
- Page Title: "${pageTitle}"
- Extracted Colors: [${extractedColors.join(", ")}]
- Extracted Fonts: [${extractedFonts.join(", ")}]
- Logo URL: ${extractedLogo}
- Full Website Text (from homepage + internal pages): """${textSample}"""

YOUR TASK: Return ONLY a valid JSON object (no markdown, no explanation, no code fences) with this EXACT schema:
{
  "brandName": "The official brand/company name",
  "logoUrl": "${extractedLogo}",
  "colors": {
    "primary": "#hex - the main brand color",
    "secondary": "#hex - supporting color",
    "background": "#hex - page background",
    "textHighContrast": "#hex - main text color",
    "accent": "#hex - accent/CTA color"
  },
  "typography": {
    "headingFont": "exact Google Font name for headings",
    "bodyFont": "exact Google Font name for body"
  },
  "tagline": "the brand's actual tagline or a highly accurate 3-8 word one inferred from the website text",
  "brandValue": "comma-separated list of 4-6 core brand values inferred from the content",
  "brandAesthetic": "comma-separated list of 3-5 visual/aesthetic descriptors",
  "toneOfVoice": "comma-separated list of 3-5 tone descriptors",
  "businessOverview": "2-3 sentence overview of what this business does, their products/services, and their positioning",
  "images": []
}

STRICT REQUIREMENTS:
1. brandName MUST be the real brand name from the website, NOT the domain name.
2. Map the scraped hex colors to the semantic color roles intelligently. Don't just copy them in order.
3. tagline should be extracted from the hero section text if possible. If none exists, write an accurate one.
4. All fields MUST be filled with real, accurate data based on the website content. NO placeholder or generic text.
5. businessOverview must describe the ACTUAL products/services mentioned on the website.
6. If extracted fonts are system fonts like Arial/Helvetica, suggest the closest Google Font equivalent.
7. Return ONLY the JSON object. No other text.`;

    const MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let aiText: string | null = null;

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[extract-dna] 🤖 Trying model: ${modelName}`);
        const response = await genAI!.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        aiText = response.text || null;
        if (aiText) { console.log(`[extract-dna] ✅ DNA response from ${modelName}`); break; }
      } catch (geminiErr: unknown) {
        const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        console.warn(`[extract-dna] ⚠ ${modelName} failed:`, errMsg.slice(0, 200));
        continue;
      }
    }

    if (!aiText) {
      console.warn("[extract-dna] All models failed. Returning raw scrape.");
      return NextResponse.json({
        dna: {
          brandName: pageTitle.split("|")[0].split("-")[0].trim() || "Unknown",
          logoUrl: extractedLogo,
          colors: { primary: extractedColors[0] || "#333", secondary: extractedColors[1] || "#666", background: "#fff", textHighContrast: "#000", accent: extractedColors[2] || "#0066ff" },
          typography: { headingFont: extractedFonts[0] || "Inter", bodyFont: extractedFonts[1] || "Inter" },
          tagline: "", brandValue: "", brandAesthetic: "", toneOfVoice: "",
          businessOverview: textSample.slice(0, 300), images: extractedImages,
        },
      });
    }

    let parsedDna;
    try {
      parsedDna = JSON.parse(aiText);
    } catch {
      console.error("[extract-dna] Invalid JSON from Gemini:", aiText.slice(0, 300));
      throw new Error("Gemini returned malformed data. Please try again.");
    }

    // Inject scraped images & preserve logo
    parsedDna.images = [...new Set(extractedImages)];
    if (!parsedDna.logoUrl && extractedLogo) parsedDna.logoUrl = extractedLogo;

    console.log("[extract-dna] ✅ Brand DNA complete:", parsedDna.brandName);

    // ══════════════════════════════════════════════════════════
    // PHASE 3 — DOCUMENT GENERATION
    // ══════════════════════════════════════════════════════════

    let documents = { strategy: "", marketResearch: "", businessProfile: "" };

    const docsPrompt = `You are a senior brand strategist and market analyst. Based on this brand data for "${parsedDna.brandName}" (${url}):

Brand Overview: ${parsedDna.businessOverview}
Tagline: ${parsedDna.tagline}
Brand Values: ${parsedDna.brandValue}
Brand Aesthetic: ${parsedDna.brandAesthetic}
Tone of Voice: ${parsedDna.toneOfVoice}
Website Text Context: """${textSample.slice(0, 2500)}"""

Generate THREE detailed, data-driven documents. Return ONLY a JSON object with this exact schema (no markdown fences):
{
  "strategy": "Full social media strategy in markdown. Required headers: ## Priority Platforms, ## Content Pillars, ## Posting Cadence, ## Messaging Hierarchy, ## Quick Wins. Be specific to the brand's actual industry.",
  "marketResearch": "Full market research in markdown. Required headers: ## Market Opportunity, ## Competitive Landscape (list 10 real competitors), ## SEO & GEO Keywords, ## Target Audiences on Social.",
  "businessProfile": "Full business profile in markdown. Required headers: ## Overview, ## Products, ## Key Selling Points, ## Retail Presence, ## Target Audience. Base on website text."
}

Rules:
- Each value is a single markdown string. Use \\n for newlines. Use - for bullets. Use **bold** for emphasis.
- Competitors must be REAL companies in the same industry/niche.
- SEO keywords must be realistic high-value terms.
- Do NOT hallucinate products not mentioned on the website.`;

    try {
      for (const modelName of MODELS_TO_TRY) {
        try {
          console.log(`[extract-dna] 📝 Generating docs with: ${modelName}`);
          const docsResponse = await genAI!.models.generateContent({
            model: modelName,
            contents: docsPrompt,
            config: { responseMimeType: "application/json" },
          });
          const docsText = docsResponse.text || null;
          if (docsText) {
            const parsed = JSON.parse(docsText);
            documents = {
              strategy: parsed.strategy || "",
              marketResearch: parsed.marketResearch || "",
              businessProfile: parsed.businessProfile || "",
            };
            console.log(`[extract-dna] ✅ Documents generated with ${modelName}`);
            break;
          }
        } catch (docErr: unknown) {
          const errMsg = docErr instanceof Error ? docErr.message : String(docErr);
          console.warn(`[extract-dna] ⚠ Doc gen ${modelName} failed:`, errMsg.slice(0, 200));
          continue;
        }
      }
    } catch {
      console.warn("[extract-dna] All doc generation failed. Using empty docs.");
    }

    return NextResponse.json({ dna: parsedDna, documents });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected server error occurred.";
    console.error("[extract-dna] ❌ Fatal error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (browser) { try { await browser.close(); } catch { /* */ } }
  }
}
