import { NextResponse } from "next/server";
import { chromium, Browser, Page } from "playwright";
import { callGemini } from "@/lib/gemini";

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
  // Reject srcset strings — they contain spaces + dimension descriptors
  if (/\s+\d+(\.\d+)?[wx]/.test(src)) return false;
  // Reject strings with multiple URLs (srcset format)
  if (/,\s*https?:\/\//.test(src)) return false;
  // Must be a clean single URL (no unencoded spaces)
  if (src.includes(" ")) return false;
  const lower = src.toLowerCase();

  // ── STRICT EXCLUSION LIST (production-grade filtering) ──
  const junk = [
    // Tracking pixels and analytics
    "pixel", "track", "analytics", "beacon", "1x1", "spacer",
    "facebook.com/tr", "google-analytics", "doubleclick",
    "googletagmanager", "hotjar", "data:image/gif",
    // UI elements
    "gravatar", "wp-emoji", "wpcf7", "spinner", "loading.gif",
    "placeholder", "avatar", "logo-small", "logo_small",
    // Social icons
    "social-icon", "share-icon", "payment-icon", "badge",
    // Decorative elements
    "divider", "separator", "line.png", "dot.png", "bullet",
    "shadow", "gradient.png", "pattern.png", "overlay.png",
  ];
  if (junk.some((j) => lower.includes(j))) return false;

  // Reject file types that are typically not brand images
  if (lower.endsWith(".ico")) return false;
  if (lower.endsWith(".gif") && !lower.includes("hero") && !lower.includes("banner")) return false;
  // Reject SVGs unless they're primary logos or hero graphics
  if (lower.endsWith(".svg") && !lower.includes("logo") && !lower.includes("hero") && !lower.includes("illustration")) return false;

  // Reject common UI icon patterns in URL path
  if (/\/(icon|favicon|sprite|arrow|chevron|check|star|dot|close|menu|hamburger|caret|toggle|search|email|phone|map-pin|location)/i.test(lower)) return false;

  // Reject images with tiny dimension hints in filename (e.g., 50x50, 32x32)
  if (/[-_](\d{1,2})x(\d{1,2})\./i.test(lower)) return false;

  return true;
}

// ── IMAGE SCORING — prioritize brand-quality images ──
interface ScoredImage {
  url: string;
  score: number;
  width: number;
  height: number;
}

function scoreImageUrl(url: string, index: number, totalImages: number): number {
  let score = 0;
  const lower = url.toLowerCase();

  // Resolution hints from URL (higher = better)
  const dimMatch = lower.match(/(\d{3,4})x(\d{3,4})/);
  if (dimMatch) {
    const w = parseInt(dimMatch[1]);
    if (w >= 1200) score += 30;
    else if (w >= 800) score += 20;
    else if (w >= 400) score += 10;
  }

  // URL keyword scoring — brand-relevant filenames
  const highPriority = ["product", "hero", "banner", "main", "cover", "feature", "collection", "campaign", "lifestyle"];
  const medPriority = ["shop", "gallery", "slider", "showcase", "portfolio", "work", "brand", "about"];
  if (highPriority.some(k => lower.includes(k))) score += 25;
  if (medPriority.some(k => lower.includes(k))) score += 15;

  // Position in DOM — earlier images tend to be more important (hero, banner)
  const positionScore = Math.max(0, 20 - Math.floor((index / Math.max(totalImages, 1)) * 20));
  score += positionScore;

  // Image format preference (AVIF/WebP = modern, likely higher quality)
  if (lower.includes(".avif")) score += 5;
  if (lower.includes(".webp")) score += 3;
  if (lower.includes(".png") && (lower.includes("product") || lower.includes("logo"))) score += 5;

  // Penalize thumbnails
  if (lower.includes("thumb") || lower.includes("small") || lower.includes("mini")) score -= 15;
  if (lower.includes("-150x") || lower.includes("-100x")) score -= 20;

  return score;
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
    const distance = 500;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      totalHeight += distance;
      if (totalHeight >= document.body.scrollHeight || totalHeight > 10000) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, 120);
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

    // Extracts the first clean URL from a potential srcset string or plain URL
    const extractCleanUrl = (raw: string): string => {
      const s = raw.trim();
      // Srcset strings look like "url1 1024w, url2 600w" or "url1 2x, url2 1x"
      // They contain space + digit + w/x or a comma followed by a URL
      if (/\s+\d+(\.\d+)?[wx]/.test(s) || /,\s*https?:\/\//.test(s)) {
        // Parse as srcset — take the LARGEST resolution (first entry by width or last by order)
        const candidates = s.split(",")
          .map((entry: string) => entry.trim().split(/\s+/)[0])
          .filter((u: string) => u.startsWith("http") || u.startsWith("//"));
        // Prefer the widest (entries sorted ascending by "Nw" — last = biggest)
        return candidates[candidates.length - 1] || "";
      }
      return s;
    };

    const addImg = (src: string | null | undefined) => {
      if (!src) return;
      let s = extractCleanUrl(src);
      if (s.startsWith("//")) s = "https:" + s;
      if (s && !seenSrcs.has(s) && s.startsWith("http") && !s.includes(" ")) {
        // Exclude base64 strings and common tracking pixels
        if (s.startsWith("data:")) return;
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
    const lazyAttrs = ["src", "data-src", "data-lazy-src", "data-original",
      "data-lazy", "data-image", "data-bg", "data-full", "data-hi-res", "loading-src"];
    for (const img of Array.from(document.querySelectorAll("img"))) {
      // Validate dimensions if possible to avoid tiny icons/pixels
      const rect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth || 0;
      const naturalHeight = img.naturalHeight || 0;
      const isTooSmall = (naturalWidth > 0 && naturalWidth < 150) || 
                         (naturalHeight > 0 && naturalHeight < 150) || 
                         (rect.width > 0 && rect.width < 150) || 
                         (rect.height > 0 && rect.height < 150);
      
      if (isTooSmall) continue;

      for (const attr of lazyAttrs) {
        const val = img.getAttribute(attr);
        if (!val) continue;
        if (val.startsWith("http") || val.startsWith("//")) {
          addImg(val);
        } else if (val.startsWith("/")) {
          try { addImg(new URL(val, document.baseURI).href); } catch { /* skip */ }
        }
      }
      // srcset + data-srcset — split properly, take LARGEST resolution
      const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset");
      if (srcset) {
        srcset.split(",").forEach((entry: string) => {
          const u = entry.trim().split(/\s+/)[0];
          if (!u) return;
          try { addImg(new URL(u, document.baseURI).href); } catch { addImg(u); }
        });
      }
    }

    // Strategy 2: Background Images
    const allElements = document.querySelectorAll("*");
    for (const el of Array.from(allElements)) {
      const style = window.getComputedStyle(el);
      const bgImg = style.backgroundImage;
      if (bgImg && bgImg !== "none") {
        const m = bgImg.match(/url\(['"]?(.*?)['"]?\)/);
        if (m && m[1]) {
          const val = m[1];
          if (val.startsWith("http") || val.startsWith("//")) {
            addImg(val);
          } else if (val.startsWith("/")) {
            try { addImg(new URL(val, document.baseURI).href); } catch { /* skip */ }
          }
        }
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
    // Remove noise before extraction
    const noiseSelectors = [
      "nav", "header", "footer", "script", "style", "noscript", "iframe",
      "svg", "form", "button", ".menu", ".nav", ".footer", ".cookie-banner",
      "[role='navigation']", "[role='banner']", "[role='contentinfo']",
      "#cookie-banner", ".modal", ".popup", "[aria-hidden='true']", "aside"
    ];
    noiseSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });

    // Extract structured text (Headings + Paragraphs)
    const textParts: string[] = [];
    
    const pageTitle = document.title;
    if (pageTitle) textParts.push(`# ${pageTitle}\n`);

    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    if (metaDesc) textParts.push(`Description: ${metaDesc}\n`);
    
    // Walk the DOM for semantic content
    const walkDOM = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        
        // Skip hidden elements
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

        if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
          const text = el.textContent?.trim().replace(/\s+/g, ' ');
          if (text && text.length > 3) textParts.push(`\n${'#'.repeat(parseInt(tag[1]))} ${text}`);
        } else if (tag === 'p') {
          // Only direct text content for paragraphs to avoid duplicating child text
          const text = el.textContent?.trim().replace(/\s+/g, ' ');
          if (text && text.length > 20) textParts.push(text);
        } else if (tag === 'li') {
          const text = el.textContent?.trim().replace(/\s+/g, ' ');
          if (text && text.length > 10) textParts.push(`- ${text}`);
        } else {
          // Recurse into children if it's a container
          node.childNodes.forEach(child => walkDOM(child));
        }
      }
    };

    walkDOM(document.body);
    
    // Deduplicate and clean
    const cleanTextParts = textParts.filter((item, index, arr) => {
      if (!item) return false;
      if (index === 0) return true;
      return item !== arr[index - 1]; // basic consecutive deduplication
    });

    const textSample = cleanTextParts.join("\n").slice(0, 15000);

    // ── INTERNAL LINKS — prioritize Level 2 pages ──
    const baseHostname = window.location.hostname;
    const seenPaths = new Set<string>([window.location.pathname]);
    const internalLinks: string[] = [];
    const level2Links: string[] = [];
    const skipPatterns = ["login", "signin", "signup", "register", "cart", "checkout", "account", "privacy", "terms", "cookie", "legal", "#", "mailto:", "tel:", "javascript:", "password", "reset", "unsubscribe", "sitemap.xml"];
    const level2Patterns = [
      "product", "shop", "collection", "service",  // commerce
      "feature", "pricing", "price", "plan",       // features/pricing
      "about", "story", "team", "mission",          // about
      "blog", "article", "news", "resource",        // content
      "case-study", "case-studies", "testimonial",   // social proof
      "work", "portfolio", "project", "gallery",     // portfolio
    ];

    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      try {
        const href = new URL((a as HTMLAnchorElement).href, document.baseURI);
        const path = href.pathname.toLowerCase();
        
        if (href.hostname === baseHostname && !seenPaths.has(href.pathname) && path !== "/") {
          if (!skipPatterns.some((s) => path.includes(s) || href.href.includes(s))) {
            seenPaths.add(href.pathname);
            
            // Categorize as Level 2 if it matches our patterns
            if (level2Patterns.some(p => path.includes(p))) {
              level2Links.push(href.href);
            } else {
              internalLinks.push(href.href);
            }
          }
        }
      } catch { /* skip */ }
    }

    // Combine Level 2 links first, then pad with other internal links up to 10-15
    const prioritizedLinks = [...level2Links, ...internalLinks].slice(0, 12);

    return {
      colors: Array.from(colors).filter((c) => c.startsWith("#")).slice(0, 25),
      fonts: Array.from(fonts).slice(0, 8),
      logoUrl,
      images: images.slice(0, 50),
      textSample,
      pageTitle: document.title,
      internalLinks: prioritizedLinks,
    };
  });
}

// ────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
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

      // Block heavy resources we don't need (we only want URLs, not file contents)
      await context.route("**/*.{mp4,webm,ogg,mp3,wav,flac,woff2,woff,ttf,eot,pdf,zip}", (route) => route.abort());

      const page = await context.newPage();

      // Navigate to main page — domcontentloaded is fast enough
      console.log("[extract-dna] 📄 Loading main page...");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

      // Short networkidle wait — enough for JS to render, don't over-wait
      try { await page.waitForLoadState("networkidle", { timeout: 4000 }); } catch { /* timeout ok */ }

      // Dismiss popups then scroll
      await dismissPopups(page);
      console.log("[extract-dna] 📜 Scrolling...");
      await autoScroll(page);
      await page.waitForTimeout(300); // was 1500ms

      const mainData = await scrapePage(page);

      extractedColors = mainData.colors;
      extractedFonts = mainData.fonts;
      extractedLogo = mainData.logoUrl;
      extractedImages = [...mainData.images];
      textSample = mainData.textSample;
      pageTitle = mainData.pageTitle;

      console.log(`[extract-dna] ✅ Main page: ${extractedImages.length} images, ${extractedColors.length} colors`);

      // ── CRAWL LEVEL 2 PAGES IN PARALLEL ──
      // Scrape up to 5 priority Level 2 pages (Features, Pricing, About, Blog, etc.)
      const internalLinks = mainData.internalLinks.slice(0, 10);
      if (internalLinks.length > 0) {
        console.log(`[extract-dna] 🔗 Crawling ${internalLinks.length} sub-pages in parallel...`);

        const scrapeSubPage = async (link: string) => {
          const subPage = await context.newPage();
          try {
            await subPage.goto(link, { waitUntil: "domcontentloaded", timeout: 10000 });
            try { await subPage.waitForLoadState("networkidle", { timeout: 2500 }); } catch { /* ok */ }
            await autoScroll(subPage);
            const subData = await scrapePage(subPage);
            console.log(`[extract-dna]   ✅ ${link} — +${subData.images.length} images`);
            return subData;
          } catch (err) {
            console.warn(`[extract-dna]   ⚠ Failed: ${link}`, err);
            return null;
          } finally {
            await subPage.close();
          }
        };

        // Run all sub-pages at the same time instead of one-by-one
        const subResults = await Promise.allSettled(internalLinks.map(scrapeSubPage));

        for (const result of subResults) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const subData = result.value;
          for (const img of subData.images) {
            if (!extractedImages.includes(img)) extractedImages.push(img);
          }
          if (subData.textSample) textSample += " | " + subData.textSample;
          for (const c of subData.colors) {
            if (!extractedColors.includes(c)) extractedColors.push(c);
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

    // ── POST-PROCESSING — PRODUCTION-GRADE IMAGE PIPELINE ──

    // Step 1: Filter images for quality (strict exclusion)
    extractedImages = extractedImages.filter(isUsefulImage);
    
    // Step 2: Deduplicate by normalized URL (strips dimension suffixes, CDN params)
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

    // Step 3: Score and rank images — keep only top 20 brand-quality images
    const scoredImages: ScoredImage[] = deduped.map((url, idx) => ({
      url,
      score: scoreImageUrl(url, idx, deduped.length),
      width: 0,
      height: 0,
    }));

    // Sort by score descending, take top 20
    scoredImages.sort((a, b) => b.score - a.score);
    extractedImages = scoredImages.slice(0, 20).map(s => s.url);

    console.log(`[extract-dna] 🖼️ Image scoring: ${deduped.length} candidates → ${extractedImages.length} top-quality images`);
    // Log top 5 scores for debugging
    scoredImages.slice(0, 5).forEach((s, i) => {
      console.log(`[extract-dna]   #${i + 1} score=${s.score} ${s.url.slice(0, 80)}...`);
    });

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

    // ══════════════════════════════════════════════════════════
    // PHASE 2 — GEMINI DNA EXTRACTION (smart model routing)
    // ══════════════════════════════════════════════════════════

    const dnaPrompt = `You are an expert Brand Analyst and designer. Analyze this website: ${url}

SCRAPED DATA:
- Page Title: "${pageTitle}"
- Extracted Colors: [${extractedColors.join(", ")}]
- Extracted Fonts: [${extractedFonts.join(", ")}]
- Logo URL: ${extractedLogo}
- Full Website Text (from homepage + internal pages): """${textSample}"""

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
  "visual_identity": {
    "primary_colors": [],
    "secondary_colors": [],
    "background_style": "",
    "lighting_style": "",
    "composition_style": "",
    "spacing_style": "",
    "design_density": "",
    "ui_style": "",
    "image_style": "",
    "illustration_style": "",
    "texture_style": ""
  },
  "brand_voice": {
    "tone": [],
    "writing_style": [],
    "sentence_length": "",
    "emotional_style": "",
    "cta_style": "",
    "personality_traits": [],
    "banned_words": [],
    "preferred_phrases": []
  },
  "content_patterns": {
    "hooks": [],
    "cta_patterns": [],
    "carousel_patterns": [],
    "headline_patterns": [],
    "visual_patterns": [],
    "post_structures": [],
    "ad_frameworks": []
  },
  "images": []
}

STRICT REQUIREMENTS:
1. brandName MUST be the real brand name from the website, NOT the domain name.
2. Map the scraped hex colors to the semantic color roles intelligently.
3. tagline should be extracted from the hero section text if possible.
4. All fields MUST be filled with real, accurate data. NO placeholder or generic text.
5. businessOverview must describe the ACTUAL products/services mentioned.
6. If extracted fonts are system fonts, suggest the closest Google Font equivalent.
7. Return ONLY the JSON object. No other text.
8. ANTIGRAVITY TEXT PROCESSOR STRICT RULES: Extract clean, structured text. Deduplicate any noise. No unnecessary symbols.`;

    let parsedDna: any;
    try {
      // DNA extraction — uses gemini-2.5-flash first (fast + accurate JSON)
      const dnaResult = await callGemini({
        taskType: "dna-extraction",
        prompt: dnaPrompt,
        mimeType: "application/json",
        minLength: 50,
      });
      parsedDna = JSON.parse(dnaResult.text);
    } catch (err: any) {
      console.warn("[extract-dna] DNA Gemini call failed, using raw scrape fallback:", err.message);
      parsedDna = {
        brandName: pageTitle.split("|")[0].split("-")[0].split("—")[0].trim() || "Unknown",
        logoUrl: extractedLogo,
        colors: {
          primary: extractedColors[0] || "#333", secondary: extractedColors[1] || "#666",
          background: "#fff", textHighContrast: "#000", accent: extractedColors[2] || "#0066ff",
        },
        typography: { headingFont: extractedFonts[0] || "Inter", bodyFont: extractedFonts[1] || "Inter" },
        tagline: "", brandValue: "", brandAesthetic: "", toneOfVoice: "",
        businessOverview: textSample.slice(0, 300), images: [],
      };
    }

    // Inject scraped images & preserve logo
    parsedDna.images = [...new Set(extractedImages)];
    if (!parsedDna.logoUrl && extractedLogo) parsedDna.logoUrl = extractedLogo;
    console.log("[extract-dna] ✅ Brand DNA complete:", parsedDna.brandName);

    // ══════════════════════════════════════════════════════════
    // PHASE 3 — DOCUMENT GENERATION (smart model routing per doc type)
    // ══════════════════════════════════════════════════════════

    const brandContext = `
Brand: ${parsedDna.brandName}
Website: ${url}
Overview: ${parsedDna.businessOverview}
Tagline: ${parsedDna.tagline}
Brand Values: ${parsedDna.brandValue}
Brand Aesthetic: ${parsedDna.brandAesthetic}
Tone of Voice: ${parsedDna.toneOfVoice}
Website Text: """${textSample.slice(0, 3000)}"""
`.trim();

    const docPrompts = {
      businessProfile: `You are a senior brand analyst. Using ONLY information from the website text below, write a highly professional Business Profile document in markdown for \${parsedDna.brandName}. 

\${brandContext}

Write the Business Profile. Format it exactly like this structure:
# \${parsedDna.brandName} – Business Profile

## Overview
A detailed paragraph explaining what the business does, who founded it (founder story), and their market positioning (e.g. bridging heritage with modern trends).

## Products
- **[Product Name]** – short description or flavor profile.

## Key Selling Points
- Provide 5-8 bullet points of the most compelling reasons to choose this brand (e.g. nutrition facts, ingredients, uses).

## Retail Presence
Where products are sold — simply list retailers, websites, or physical locations.

## Target Audience
5 demographic or psychographic bullet points (e.g. Health-conscious UK consumers, Flexitarians).

## Founder Story
A short paragraph about the founders' background, heritage, and why they built the company.

## Marketing Goals
- Social media growth and engagement
- Brand awareness
- [add any other inferred goals]

## Website
\${url}

Rules:
1. Only facts from brand data.
2. DO NOT use markdown tables; use bulleted lists instead.
3. Use ## headers, - bullets.
4. ANTIGRAVITY TEXT PROCESSOR STRICT RULES: Clean text, clear hierarchy, structured format. NO placeholders (e.g., {{title}}, lorem ipsum). Human-readable, polished formatting ready to publish. No unnecessary symbols or encoding issues.`,

      marketResearch: `You are a senior market researcher. Write a highly professional Market Research document in markdown for \${parsedDna.brandName}.

\${brandContext}

Write the Market Research exactly like this structure:
# \${parsedDna.brandName} – Market Research

## Market Opportunity
4-5 bullet points on the market they operate in, growth indicators, and macro trends.

## Trend Tailwinds
3-4 bullet points on specific consumer trends driving this industry right now.

## Competitive Landscape
List real named competitor companies. 
- **[Competitor Name]** – 1 line on what they do and how they compare.
- **[Competitor Name]** – ...
Include a bullet point for "\${parsedDna.brandName}'s edge".

## Key Risk
1-2 bullet points on vulnerabilities (e.g. market education needed, algorithm changes).

## Social Platform Data (2025)
- TikTok brand follower growth potential
- Instagram organic reach trends
- LinkedIn B2B growth
- Best-performing content types

## Target Audiences on Social
4-5 distinct audience segments. Format:
- **[Segment Name]** – what they respond to / how to frame the product.

Rules:
1. Real named competitors only.
2. DO NOT use markdown tables; use bulleted lists instead.
3. ANTIGRAVITY TEXT PROCESSOR STRICT RULES: Clean text, clear hierarchy, structured format. NO placeholders (e.g., {{title}}, lorem ipsum). Human-readable, polished formatting ready to publish. No unnecessary symbols or encoding issues.`,

      strategy: `You are a senior social media strategist. Write a highly professional Social Media Strategy document in markdown for \${parsedDna.brandName}.

\${brandContext}

Write the Social Media Strategy exactly like this structure:
# \${parsedDna.brandName} – Social Media Strategy

## Priority Platforms (Ranked)
- **[Platform 1]** – why it's a priority and content format.
- **[Platform 2]** – ...

## Content Pillars (use across all platforms)
1. **[Pillar 1 Name]** (e.g. Product Proof)
Provide 3-4 bullet points of example post ideas under this pillar.
2. **[Pillar 2 Name]** (e.g. Founder Story)
Provide 3-4 bullet points...
(Include 4-5 pillars total)

## Posting Cadence (Recommended)
Use bullet points to list recommended posting frequency and priority format per platform (e.g. TikTok: 4-5x per week... Instagram: 4x per week).

## Messaging Hierarchy
4 core messages ranked by priority:
- "Lead hook / Main claim" — lead hook
- "Secondary claim" — secondary hook
- "Validation" — proof via reviews or demos
- "Trust factor" — trust + authenticity

## Quick Wins
5-6 bullet points of immediate, easily actionable tactics for the next 30 days (e.g. pin a video, repurpose reviews, get founder on camera).

Rules:
1. Specific to \${parsedDna.brandName}'s industry. Tone: \${parsedDna.toneOfVoice}.
2. DO NOT use markdown tables; use bulleted lists.`,
    };

    // Each doc type uses its own optimal model order via smart router
    const [businessProfile, marketResearch, strategy] = await Promise.all([
      callGemini({ taskType: "business-profile", prompt: docPrompts.businessProfile, minLength: 300 })
        .then(r => r.text).catch(() => ""),
      callGemini({ taskType: "market-research", prompt: docPrompts.marketResearch, minLength: 300 })
        .then(r => r.text).catch(() => ""),
      callGemini({ taskType: "social-strategy", prompt: docPrompts.strategy, minLength: 300 })
        .then(r => r.text).catch(() => ""),
    ]);

    console.log(`[extract-dna] 📄 Docs — profile:${businessProfile.length} research:${marketResearch.length} strategy:${strategy.length}`);

    return NextResponse.json({ dna: parsedDna, documents: { businessProfile, marketResearch, strategy } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected server error occurred.";
    console.error("[extract-dna] ❌ Fatal error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (browser) { try { await browser.close(); } catch { /* */ } }
  }
}
