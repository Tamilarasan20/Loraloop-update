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
      let s = extractCleanUrl(src.trim());
      if (s.startsWith("//")) s = "https:" + s;
      // Resolve relative URLs
      if (s && !s.startsWith("http") && !s.startsWith("data:")) {
        try { s = new URL(s, document.baseURI).href; } catch { return; }
      }
      if (s && !seenSrcs.has(s) && s.startsWith("http") && !s.includes(" ") && !s.startsWith("data:")) {
        seenSrcs.add(s);
        images.push(s);
      }
    };

    // Extracts all URLs from a srcset string
    const addSrcset = (srcset: string | null | undefined) => {
      if (!srcset) return;
      srcset.split(",").forEach((entry: string) => {
        const u = entry.trim().split(/\s+/)[0];
        if (u) addImg(u);
      });
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

    // 7. Manifest
    if (!logoUrl) {
      const manifest = document.querySelector('link[rel="manifest"]');
      if (manifest) logoUrl = "__MANIFEST__:" + (manifest as HTMLLinkElement).href;
    }

    // ══════════════════════════════════════════════════════════════════
    // ULTRA-AGGRESSIVE IMAGE EXTRACTION — 15 STRATEGIES
    // ══════════════════════════════════════════════════════════════════

    // ── STRATEGY 1: Meta tags (OG, Twitter, schema) ──
    const metaImgSelectors = [
      'meta[property="og:image"]', 'meta[property="og:image:url"]',
      'meta[name="twitter:image"]', 'meta[name="twitter:image:src"]',
      'meta[itemprop="image"]', 'meta[property="product:image"]',
    ];
    for (const sel of metaImgSelectors) {
      const el = document.querySelector(sel);
      if (el) addImg((el as HTMLMetaElement).content);
    }


    // ── STRATEGY 2: All <img> tags — 30+ lazy-load attribute variants ──
    const lazyAttrs = [
      "src", "data-src", "data-lazy-src", "data-original", "data-lazy",
      "data-image", "data-bg", "data-full", "data-hi-res", "loading-src",
      "data-url", "data-img-src", "data-img-url", "data-echo",
      "data-large", "data-large-file", "data-retina", "data-2x",
      "data-zoom-image", "data-highres", "data-original-src",
      "data-fallback-src", "data-noscript-src", "data-default-src",
      "data-swiper-lazy", "data-flickity-lazyload", "data-lazy-load",
      "data-pagespeed-lazy-src",
    ];
    for (const img of Array.from(document.querySelectorAll("img"))) {
      for (const attr of lazyAttrs) {
        const val = img.getAttribute(attr);
        if (val) addImg(val);
      }
      addSrcset(img.getAttribute("srcset"));
      addSrcset(img.getAttribute("data-srcset"));
      addSrcset(img.getAttribute("data-lazy-srcset"));
    }

    // ── STRATEGY 3: <picture> and <video> <source> ──
    for (const source of Array.from(document.querySelectorAll("picture source, video source"))) {
      addSrcset(source.getAttribute("srcset"));
      addImg(source.getAttribute("src"));
    }

    // ── STRATEGY 4: <video> poster ──
    for (const video of Array.from(document.querySelectorAll("video[poster]"))) {
      addImg(video.getAttribute("poster"));
    }

    // ── STRATEGY 5: CSS computed background-image on EVERY element ──
    for (const el of Array.from(document.querySelectorAll("*"))) {
      try {
        const cs = window.getComputedStyle(el as Element);
        const bgImg = cs.backgroundImage;
        if (bgImg && bgImg !== "none") {
          const matches = bgImg.matchAll(/url\(["']?(.*?)["']?\)/g);
          for (const m of matches) {
            if (m[1] && !m[1].startsWith("data:image/svg") && !m[1].startsWith("data:image/gif")) {
              addImg(m[1]);
            }
          }
        }
      } catch { /* skip */ }
    }

    // ── STRATEGY 6: Inline style background-image ──
    for (const el of Array.from(document.querySelectorAll("[style]"))) {
      const style = el.getAttribute("style") || "";
      if (style.includes("background") || style.includes("url(")) {
        const matches = style.matchAll(/url\(["']?(.*?)["']?\)/g);
        for (const m of matches) addImg(m[1]);
      }
    }

    // ── STRATEGY 7: <a href> linking directly to image files ──
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const href = (a as HTMLAnchorElement).href;
      if (/\.(jpg|jpeg|png|webp|avif|gif|bmp|svg)([\?#]|$)/i.test(href)) addImg(href);
    }

    // ── STRATEGY 8: <object> and <embed> data attributes ──
    for (const el of Array.from(document.querySelectorAll("object[data], embed[src]"))) {
      const src = el.getAttribute("data") || el.getAttribute("src") || "";
      if (/\.(jpg|jpeg|png|webp|avif|svg)/i.test(src)) addImg(src);
    }

    // ── STRATEGY 9: <noscript> fallback images ──
    for (const ns of Array.from(document.querySelectorAll("noscript"))) {
      const html = ns.innerHTML;
      const srcMatch = html.match(/src=['"]([^'"]+)['"]/);
      if (srcMatch) addImg(srcMatch[1]);
      const srcsetMatch = html.match(/srcset=['"]([^'"]+)['"]/);
      if (srcsetMatch) addSrcset(srcsetMatch[1]);
    }

    // ── STRATEGY 10: JSON-LD structured data (Product, ImageObject, etc.) ──
    for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        const data = JSON.parse(script.textContent || "");
        const extractFromJson = (obj: any) => {
          if (!obj || typeof obj !== "object") return;
          if (Array.isArray(obj)) { obj.forEach(extractFromJson); return; }
          for (const key of ["image", "url", "contentUrl", "thumbnailUrl", "logo", "photo"]) {
            if (obj[key]) {
              if (typeof obj[key] === "string") addImg(obj[key]);
              else if (Array.isArray(obj[key])) obj[key].forEach((u: any) => typeof u === "string" ? addImg(u) : addImg(u?.url));
              else if (obj[key]?.url) addImg(obj[key].url);
            }
          }
          Object.values(obj).forEach(extractFromJson);
        };
        extractFromJson(data);
      } catch { /* skip malformed JSON-LD */ }
    }

    // ── STRATEGY 11: Next.js __NEXT_DATA__ injection ──
    const nextDataEl = document.getElementById("__NEXT_DATA__");
    if (nextDataEl) {
      try {
        const nextData = JSON.parse(nextDataEl.textContent || "");
        const extractImagesFromObject = (obj: any, depth = 0) => {
          if (depth > 6 || !obj) return;
          if (typeof obj === "string" && /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif)/i.test(obj)) { addImg(obj); }
          else if (Array.isArray(obj)) { obj.forEach(item => extractImagesFromObject(item, depth + 1)); }
          else if (typeof obj === "object") { for (const val of Object.values(obj)) extractImagesFromObject(val, depth + 1); }
        };
        extractImagesFromObject(nextData);
      } catch { /* skip */ }
    }

    // ── STRATEGY 12: Shopify / inline script image URLs ──
    for (const script of Array.from(document.querySelectorAll("script:not([src])"))) {
      const text = script.textContent || "";
      if (text.includes("cdn.shopify.com") || text.includes("featured_image")) {
        const urls = text.match(/https?:\/\/cdn\.shopify\.com\/[^\s"'\\]+\.(jpg|jpeg|png|webp)/gi) || [];
        urls.forEach(addImg);
      }
      if (text.includes("product") || text.includes("gallery") || text.includes("carousel") || text.includes("images")) {
        const matches = text.match(/["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp|avif))["']/gi) || [];
        matches.slice(0, 40).forEach(m => addImg(m.replace(/["']/g, "")));
      }
    }

    // ── STRATEGY 13: data-* attributes containing image URLs ──
    const imgDataSelectors = [
      "[data-background]", "[data-bg]", "[data-image]", "[data-img]",
      "[data-thumb]", "[data-cover]", "[data-hero]", "[data-poster]",
      "[data-slide-bg]", "[data-carousel-src]", "[data-lazy-background]",
      "[data-fancybox]", "[data-swiper-slide-image]",
    ];
    for (const sel of imgDataSelectors) {
      for (const el of Array.from(document.querySelectorAll(sel))) {
        for (const attr of Array.from((el as Element).attributes)) {
          if (attr.name.startsWith("data-") && attr.value.startsWith("http") && /\.(jpg|jpeg|png|webp|avif)/i.test(attr.value)) {
            addImg(attr.value);
          }
        }
      }
    }

    // ── STRATEGY 14: Scan ALL element attributes for image URLs ──
    for (const el of Array.from(document.querySelectorAll("*")).slice(0, 3000)) {
      for (const attr of Array.from((el as Element).attributes)) {
        const v = attr.value;
        if (v && v.length > 10 && v.length < 500 && v.startsWith("http") && /\.(jpg|jpeg|png|webp|avif)([\?&]|$)/i.test(v)) {
          addImg(v);
        }
      }
    }

    // ── STRATEGY 15: CSS custom property image values ──
    const cssVarPrefixes = ["--bg-image", "--hero-image", "--background-image", "--image-url", "--img-src", "--slide-bg", "--cover"];
    for (const el of Array.from(document.querySelectorAll("[style]")).slice(0, 300)) {
      try {
        const styles = window.getComputedStyle(el as Element);
        for (const varName of cssVarPrefixes) {
          const val = styles.getPropertyValue(varName).trim();
          if (val && val.includes("url(")) {
            const m = val.match(/url\(["']?(.*?)["']?\)/);
            if (m) addImg(m[1]);
          }
        }
      } catch { /* skip */ }
    }

    // ── COLORS & FONTS ──
    const allEls = [
      document.body,
      ...Array.from(document.querySelectorAll(
        "header,footer,nav,main,section,article,aside,div,span,a,button,figure,h1,h2,h3,h4,h5,h6,p,[class*='hero'],[class*='banner'],[class*='slide'],[class*='bg'],[class*='image'],[class*='thumb'],[class*='card'],[class*='cover'],[class*='feature'],[style*='background']"
      )),
    ];
    const colors = new Set<string>();
    const fonts = new Set<string>();
    for (const el of allEls) {
      try {
        const cs = window.getComputedStyle(el);
        const bg = cs.backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") colors.add(rgb2hex(bg));
        const clr = cs.color;
        if (clr) colors.add(rgb2hex(clr));
        const border = cs.borderColor;
        if (border && border !== "rgba(0, 0, 0, 0)" && border !== "transparent" && border !== "rgb(0, 0, 0)") {
          colors.add(rgb2hex(border));
        }
        if (cs.fontFamily) {
          const primary = cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
          if (primary && primary !== "inherit" && primary !== "initial") fonts.add(primary);
        }
      } catch { /* skip */ }
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
    const skipPatterns = [
      "login", "signin", "signup", "register", "cart", "checkout",
      "account", "privacy", "terms", "cookie", "legal", "#", "mailto:",
      "tel:", "javascript:", "password", "reset", "unsubscribe",
      "sitemap.xml", "wp-admin", "wp-login", "feed", ".rss", ".atom",
    ];
    const level2Patterns = [
      "product", "shop", "collection", "service", "catalogue", "catalog", "menu",
      "feature", "pricing", "price", "plan", "subscription",
      "about", "story", "team", "mission", "values", "sustainability",
      "blog", "article", "news", "resource", "guide", "learn", "press",
      "case-study", "case-studies", "testimonial", "review", "customer",
      "work", "portfolio", "project", "gallery", "look-book", "lookbook",
      "brand", "media", "assets",
    ];

    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      try {
        const href = new URL((a as HTMLAnchorElement).href, document.baseURI);
        const path = href.pathname.toLowerCase();
        if (href.hostname === baseHostname && !seenPaths.has(href.pathname) && path !== "/") {
          if (!skipPatterns.some((s) => path.includes(s) || href.href.includes(s))) {
            seenPaths.add(href.pathname);
            if (level2Patterns.some(p => path.includes(p))) {
              level2Links.push(href.href);
            } else {
              internalLinks.push(href.href);
            }
          }
        }
      } catch { /* skip */ }
    }

    // Level 2 first, then all other internal links — up to 15 pages
    const prioritizedLinks = [...level2Links, ...internalLinks].slice(0, 15);

    return {
      colors: Array.from(colors).filter((c) => c.startsWith("#")).slice(0, 25),
      fonts: Array.from(fonts).slice(0, 8),
      logoUrl,
      images: images.slice(0, 200),
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
    // PHASE 1 — DEEP PLAYWRIGHT SCRAPE + 5 ADVANCED STRATEGIES
    // ══════════════════════════════════════════════════════════
    let textSample = "";
    let extractedColors: string[] = [];
    let extractedFonts: string[] = [];
    let extractedLogo = "";
    let extractedImages: string[] = [];
    let pageTitle = "";

    // Track images found per strategy for logging
    const strategyStats = {
      network: 0,
      dom: 0,
      sitemap: 0,
      carousel: 0,
      css: 0,
      xhr: 0,
      subPages: 0,
    };

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

      // Block heavy resources we don't need
      await context.route("**/*.{mp4,webm,ogg,mp3,wav,flac,woff2,woff,ttf,eot,pdf,zip}", (route) => route.abort());

      const page = await context.newPage();

      // ════════════════════════════════════════════
      // STRATEGY A: NETWORK INTERCEPTION (captures ALL image requests)
      // ════════════════════════════════════════════
      const networkImages = new Set<string>();
      const xhrImages = new Set<string>();

      page.on("response", async (response) => {
        try {
          const resUrl = response.url();
          const contentType = response.headers()["content-type"] || "";
          const status = response.status();

          // Strategy A1: Direct image responses
          if (status === 200 && contentType.startsWith("image/")) {
            if (isUsefulImage(resUrl) && !networkImages.has(resUrl)) {
              networkImages.add(resUrl);
            }
          }

          // Strategy A2: XHR/Fetch API interception — JSON responses containing image URLs
          if (status === 200 && (contentType.includes("application/json") || contentType.includes("text/json"))) {
            try {
              const body = await response.text();
              // Extract image URLs from JSON strings
              const imgMatches = body.match(/(https?:\/\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp|avif))/gi) || [];
              for (const imgUrl of imgMatches) {
                const clean = imgUrl.replace(/\\/g, "");
                if (isUsefulImage(clean) && !xhrImages.has(clean)) {
                  xhrImages.add(clean);
                }
              }
            } catch { /* not parseable — skip */ }
          }
        } catch { /* skip response errors */ }
      });

      // Navigate to main page
      console.log("[extract-dna] 📄 Loading main page...");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

      // Short networkidle wait
      try { await page.waitForLoadState("networkidle", { timeout: 5000 }); } catch { /* timeout ok */ }

      // Dismiss popups then scroll
      await dismissPopups(page);
      console.log("[extract-dna] 📜 Scrolling...");
      await autoScroll(page);
      await page.waitForTimeout(500);

      // ════════════════════════════════════════════
      // STRATEGY B: CAROUSEL/SLIDER CLICK AUTOMATION
      // ════════════════════════════════════════════
      console.log("[extract-dna] 🎠 Clicking carousels/sliders...");
      const carouselBefore = networkImages.size;
      try {
        const carouselSelectors = [
          // Next/arrow buttons
          '[class*="next"]', '[class*="arrow-right"]', '[class*="slick-next"]',
          '[class*="swiper-button-next"]', '[data-slide="next"]',
          '[aria-label="Next"]', '[aria-label="next"]', '[aria-label="Next slide"]',
          'button[class*="carousel"] + button', '.flickity-prev-next-button.next',
          '[class*="glide__arrow--right"]', '[class*="owl-next"]',
          // Dots/pagination
          '[class*="slick-dots"] li:nth-child(2)', '[class*="swiper-pagination-bullet"]:nth-child(2)',
          '[class*="carousel-indicators"] li:nth-child(2)',
        ];

        for (const sel of carouselSelectors) {
          try {
            const btn = page.locator(sel).first();
            if (await btn.isVisible({ timeout: 200 })) {
              // Click through up to 8 slides
              for (let i = 0; i < 8; i++) {
                try {
                  await btn.click({ timeout: 500 });
                  await page.waitForTimeout(400);
                } catch { break; }
              }
            }
          } catch { /* selector not found — expected */ }
        }

        // Also try Tab-based interaction on product galleries
        try {
          const thumbs = page.locator('[class*="thumbnail"], [class*="thumb"], [class*="product-image"], [class*="gallery-item"]');
          const thumbCount = await thumbs.count();
          for (let i = 0; i < Math.min(thumbCount, 10); i++) {
            try {
              await thumbs.nth(i).click({ timeout: 300 });
              await page.waitForTimeout(300);
            } catch { break; }
          }
        } catch { /* no thumbnails */ }
      } catch (err) {
        console.warn("[extract-dna] ⚠ Carousel automation error:", err);
      }
      strategyStats.carousel = networkImages.size - carouselBefore;
      console.log(`[extract-dna] 🎠 Carousel clicks revealed ${strategyStats.carousel} new images`);

      // Wait for any lazy images triggered by carousel
      await page.waitForTimeout(500);

      // ════════════════════════════════════════════
      // STRATEGY C: EXTERNAL CSS STYLESHEET PARSING
      // ════════════════════════════════════════════
      console.log("[extract-dna] 🎨 Parsing external CSS stylesheets...");
      const cssImages = new Set<string>();
      try {
        // Get all stylesheet URLs
        const stylesheetUrls = await page.evaluate(() => {
          const links: string[] = [];
          document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = (link as HTMLLinkElement).href;
            if (href && href.startsWith("http")) links.push(href);
          });
          return links;
        });

        // Fetch and parse each CSS file for background-image URLs
        const cssPromises = stylesheetUrls.slice(0, 10).map(async (cssUrl) => {
          try {
            const cssPage = await context.newPage();
            const resp = await cssPage.goto(cssUrl, { timeout: 5000 });
            const cssText = await resp?.text() || "";
            await cssPage.close();

            // Extract all url() from CSS
            const urlMatches = cssText.matchAll(/url\(["']?((?:https?:\/\/|\/)[^"')]+\.(jpg|jpeg|png|webp|avif))["']?\)/gi);
            for (const m of urlMatches) {
              let imgUrl = m[1];
              if (imgUrl.startsWith("/")) {
                try { imgUrl = new URL(imgUrl, url).href; } catch { continue; }
              }
              if (isUsefulImage(imgUrl)) cssImages.add(imgUrl);
            }
          } catch { /* skip failed CSS */ }
        });
        await Promise.allSettled(cssPromises);
      } catch (err) {
        console.warn("[extract-dna] ⚠ CSS parsing error:", err);
      }
      strategyStats.css = cssImages.size;
      console.log(`[extract-dna] 🎨 CSS stylesheets: ${cssImages.size} images found`);

      // ── DOM SCRAPE (existing 15-strategy function) ──
      const mainData = await scrapePage(page);

      extractedColors = mainData.colors;
      extractedFonts = mainData.fonts;
      extractedLogo = mainData.logoUrl;
      extractedImages = [...mainData.images];
      textSample = mainData.textSample;
      pageTitle = mainData.pageTitle;
      strategyStats.dom = mainData.images.length;

      console.log(`[extract-dna] ✅ Main page DOM: ${extractedImages.length} images, ${extractedColors.length} colors`);

      // Merge network-intercepted images
      for (const img of networkImages) {
        if (!extractedImages.includes(img)) extractedImages.push(img);
      }
      strategyStats.network = networkImages.size;
      console.log(`[extract-dna] 🌐 Network interception: ${networkImages.size} images captured`);

      // Merge XHR/API images
      for (const img of xhrImages) {
        if (!extractedImages.includes(img)) extractedImages.push(img);
      }
      strategyStats.xhr = xhrImages.size;
      console.log(`[extract-dna] 📡 XHR/API interception: ${xhrImages.size} images captured`);

      // Merge CSS images
      for (const img of cssImages) {
        if (!extractedImages.includes(img)) extractedImages.push(img);
      }

      // ════════════════════════════════════════════
      // STRATEGY D: SITEMAP.XML CRAWLING
      // ════════════════════════════════════════════
      console.log("[extract-dna] 🗺️ Attempting sitemap.xml crawl...");
      let sitemapLinks: string[] = [];
      try {
        const sitemapUrls = [
          new URL("/sitemap.xml", url).href,
          new URL("/sitemap_index.xml", url).href,
          new URL("/wp-sitemap.xml", url).href,
          new URL("/sitemap-index.xml", url).href,
        ];

        for (const smUrl of sitemapUrls) {
          try {
            const smResp = await fetch(smUrl, {
              headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/xml,text/xml" },
              signal: AbortSignal.timeout(5000),
            });
            if (!smResp.ok) continue;
            const smText = await smResp.text();
            if (!smText.includes("<url") && !smText.includes("<sitemap")) continue;

            // Extract <loc> URLs
            const locMatches = smText.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);
            const smSkip = ["login", "signin", "account", "privacy", "terms", "cookie", "legal", "cart", "checkout", "wp-admin", "feed"];
            const smPriority = ["product", "shop", "collection", "gallery", "about", "feature", "portfolio", "service", "brand"];
            
            const priorityLinks: string[] = [];
            const otherLinks: string[] = [];
            
            for (const lm of locMatches) {
              const locUrl = lm[1].trim();
              const lower = locUrl.toLowerCase();
              // Skip non-page URLs
              if (smSkip.some(s => lower.includes(s))) continue;
              if (lower.endsWith(".pdf") || lower.endsWith(".zip") || lower.endsWith(".xml")) continue;
              // Already crawled?
              if (extractedImages.some(img => img.includes(locUrl))) continue;
              
              if (smPriority.some(p => lower.includes(p))) {
                priorityLinks.push(locUrl);
              } else {
                otherLinks.push(locUrl);
              }
            }
            
            // If this was a sitemap index, recursively get child sitemaps
            if (smText.includes("<sitemap")) {
              console.log("[extract-dna] 🗺️ Found sitemap index, parsing child sitemaps...");
              const childSitemaps = smText.match(/<loc>\s*(.*?)\s*<\/loc>/gi) || [];
              for (const childLoc of childSitemaps.slice(0, 5)) {
                const childUrl = childLoc.replace(/<\/?loc>/gi, "").trim();
                try {
                  const childResp = await fetch(childUrl, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    signal: AbortSignal.timeout(5000),
                  });
                  if (childResp.ok) {
                    const childText = await childResp.text();
                    const childLocs = childText.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);
                    for (const cl of childLocs) {
                      const cUrl = cl[1].trim();
                      const cLower = cUrl.toLowerCase();
                      if (smSkip.some(s => cLower.includes(s))) continue;
                      if (smPriority.some(p => cLower.includes(p))) {
                        priorityLinks.push(cUrl);
                      } else {
                        otherLinks.push(cUrl);
                      }
                    }
                  }
                } catch { /* skip child */ }
              }
            }
            
            sitemapLinks = [...priorityLinks, ...otherLinks];
            console.log(`[extract-dna] 🗺️ Sitemap: ${sitemapLinks.length} URLs found (${priorityLinks.length} priority)`);
            break; // Found a working sitemap
          } catch { /* try next sitemap URL */ }
        }
      } catch (err) {
        console.warn("[extract-dna] ⚠ Sitemap crawl error:", err);
      }

      // ── CRAWL LEVEL 2 PAGES (DOM-discovered + sitemap-discovered) ──
      // Combine DOM-discovered links with sitemap links, deduplicate
      const domLinks = mainData.internalLinks.slice(0, 10);
      const allCrawlLinks = new Set<string>([...domLinks]);
      for (const sl of sitemapLinks) {
        if (!allCrawlLinks.has(sl) && allCrawlLinks.size < 20) {
          allCrawlLinks.add(sl);
        }
      }
      const finalCrawlLinks = Array.from(allCrawlLinks);

      if (finalCrawlLinks.length > 0) {
        console.log(`[extract-dna] 🔗 Crawling ${finalCrawlLinks.length} sub-pages (${domLinks.length} DOM + ${finalCrawlLinks.length - domLinks.length} sitemap)...`);

        const scrapeSubPage = async (link: string) => {
          const subPage = await context.newPage();
          try {
            await subPage.goto(link, { waitUntil: "domcontentloaded", timeout: 10000 });
            try { await subPage.waitForLoadState("networkidle", { timeout: 3000 }); } catch { /* ok */ }
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

        // Run in batches of 5 to avoid overwhelming the browser
        const batches: string[][] = [];
        for (let i = 0; i < finalCrawlLinks.length; i += 5) {
          batches.push(finalCrawlLinks.slice(i, i + 5));
        }

        for (const batch of batches) {
          const subResults = await Promise.allSettled(batch.map(scrapeSubPage));
          for (const result of subResults) {
            if (result.status !== "fulfilled" || !result.value) continue;
            const subData = result.value;
            strategyStats.subPages += subData.images.length;
            for (const img of subData.images) {
              if (!extractedImages.includes(img)) extractedImages.push(img);
            }
            if (subData.textSample) textSample += " | " + subData.textSample;
            for (const c of subData.colors) {
              if (!extractedColors.includes(c)) extractedColors.push(c);
            }
          }
        }
        strategyStats.sitemap = sitemapLinks.length;
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

      // ── STRATEGY SUMMARY LOG ──
      console.log(`[extract-dna] ════════════════════════════════════`);
      console.log(`[extract-dna] 📊 IMAGE STRATEGY BREAKDOWN:`);
      console.log(`[extract-dna]   DOM scrape (15 strategies): ${strategyStats.dom}`);
      console.log(`[extract-dna]   Network interception:       ${strategyStats.network}`);
      console.log(`[extract-dna]   XHR/API interception:       ${strategyStats.xhr}`);
      console.log(`[extract-dna]   Carousel automation:        ${strategyStats.carousel}`);
      console.log(`[extract-dna]   CSS stylesheet parsing:     ${strategyStats.css}`);
      console.log(`[extract-dna]   Sitemap URLs discovered:    ${strategyStats.sitemap}`);
      console.log(`[extract-dna]   Sub-page crawl images:      ${strategyStats.subPages}`);
      console.log(`[extract-dna]   TOTAL RAW (before dedup):   ${extractedImages.length}`);
      console.log(`[extract-dna] ════════════════════════════════════`);

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

    // Step 3: Score and rank images — keep top 50 highest-scoring brand images
    const scoredImages: ScoredImage[] = deduped.map((url, idx) => ({
      url,
      score: scoreImageUrl(url, idx, deduped.length),
      width: 0,
      height: 0,
    }));

    // Sort by score descending, take top 50
    scoredImages.sort((a, b) => b.score - a.score);
    extractedImages = scoredImages.slice(0, 50).map(s => s.url);

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
    // PHASE 3 — DOCUMENT GENERATION (zero-hallucination, website-sourced)
    // ══════════════════════════════════════════════════════════

    const brandName = parsedDna.brandName || "Brand";
    const websiteUrl = url;
    const overview = parsedDna.businessOverview || "";
    const tagline = parsedDna.tagline || "";
    const brandValues = parsedDna.brandValue || "";
    const brandAesthetic = parsedDna.brandAesthetic || "";
    const toneOfVoice = parsedDna.toneOfVoice || "";
    const websiteText = textSample.slice(0, 8000);

    const sharedContext = `
BRAND: ${brandName}
WEBSITE: ${websiteUrl}
OVERVIEW: ${overview}
TAGLINE: ${tagline}
BRAND VALUES: ${brandValues}
BRAND AESTHETIC: ${brandAesthetic}
TONE OF VOICE: ${toneOfVoice}
COLORS: ${extractedColors.slice(0, 10).join(", ")}
FONTS: ${extractedFonts.slice(0, 5).join(", ")}

=== FULL WEBSITE TEXT (scraped from homepage + ${extractedImages.length > 0 ? "sub-pages" : "homepage only"}) ===
${websiteText}
=== END WEBSITE TEXT ===

CRITICAL RULES:
1. Use ONLY information found in the website text above.
2. If information is NOT in the website text → write "Not found on website".
3. Do NOT hallucinate, assume, or use prior knowledge.
4. Every claim must be traceable to the website text.
5. DO NOT use markdown tables; use bulleted lists.
6. No placeholders. No generic marketing language.
`.trim();

    const profilePrompt = `You are a strict, zero-hallucination business analyst. Write a Business Profile for ${brandName} using ONLY the website content below.

${sharedContext}

OUTPUT FORMAT (markdown):

# ${brandName} – Business Profile

## Overview
(2-3 sentences from website text about what the business does)

## Products/Services
- **[Product Name]** – description (ONLY products explicitly mentioned on website)
- If none found → "Not found on website"

## Key Selling Points
- ONLY explicit value propositions from the website
- If none found → "Not found on website"

## Retail Presence
- Where products are sold (ONLY if mentioned on website)
- If not mentioned → "Not found on website"

## Target Audience
- ONLY if explicitly stated on website
- If not stated → "Not found on website"

## Founder Story
- ONLY if mentioned on website
- If not mentioned → "Not found on website"

## Brand Identity
- Tagline: ${tagline || "Not found on website"}
- Values: ${brandValues || "Not found on website"}
- Aesthetic: ${brandAesthetic || "Not found on website"}
- Tone: ${toneOfVoice || "Not found on website"}

## Digital Presence
- Website: ${websiteUrl}
- Images captured: ${extractedImages.length}

## Gaps & Missing Information
List what was NOT found on the website.

OUTPUT ONLY THE MARKDOWN. No explanations.`;

    const researchPrompt = `You are a strict, zero-hallucination market researcher. Write Market Research for ${brandName} using ONLY the website content below.

${sharedContext}

OUTPUT FORMAT (markdown):

# ${brandName} – Market Research

## Market Opportunity
- ONLY if stated on website, otherwise "Not found on website"

## Keywords
- Extract ONLY repeated or emphasized terms from the website text
- Do NOT add generic industry keywords

## Competitors
- ONLY if the website explicitly mentions competitor names
- Otherwise → "Not found on website"

## Trend Tailwinds
- ONLY if the website mentions industry trends
- Otherwise → "Not found on website"

## Key Risks
- ONLY if mentioned on website
- Otherwise → "Not found on website"

## Target Audiences
- ONLY if explicitly described on the website
- Otherwise → "Not found on website"

## Brand Positioning Signals
- Tagline, value props, visual style cues found on the website

## Digital Footprint
- Website: ${websiteUrl}
- Brand images: ${extractedImages.length}
- Colors identified: ${extractedColors.length}
- Fonts identified: ${extractedFonts.length}

## Gaps & Missing Information
List what was NOT found on the website.

OUTPUT ONLY THE MARKDOWN. No explanations.`;

    const strategyPrompt = `You are a strict, zero-hallucination social media strategist. Write a Social Strategy for ${brandName} using ONLY the website content below.

${sharedContext}

OUTPUT FORMAT (markdown):

# ${brandName} – Social Strategy

## Platforms
- ONLY from visible social links or mentions on the website
- If no social links found → "Not found on website"

## Content Pillars
- Derived ONLY from products, features, or blog topics found on the website
- Each pillar must reference specific content from the website
- Do NOT create generic pillars

## Posting Ideas
- Each idea MUST directly map to an actual product, feature, or content from the website
- No generic ideas

## Messaging Hierarchy
- ONLY from actual taglines, headlines, and CTAs found on the website
- If insufficient → "Not found on website"

## Visual Guidelines for Social
- Primary Color: ${extractedColors[0] || "Not found"}
- Accent Color: ${extractedColors[1] || "Not found"}
- Typography: ${extractedFonts[0] || "Not found"}
- Style: ${brandAesthetic || "Not found"}

## Quick Wins (Next 30 Days)
- ONLY actionable items that reference specific products/content from the website
- No generic tactics

## Gaps & Missing Information
List what was NOT found on the website.

OUTPUT ONLY THE MARKDOWN. No explanations.`;

    // Generate all 3 docs in parallel with sonnet tier for quality
    const [businessProfile, marketResearch, strategy] = await Promise.all([
      callGemini({ taskType: "business-profile", prompt: profilePrompt, minLength: 300, costTier: "sonnet" })
        .then(r => r.text).catch(() => ""),
      callGemini({ taskType: "market-research", prompt: researchPrompt, minLength: 300, costTier: "sonnet" })
        .then(r => r.text).catch(() => ""),
      callGemini({ taskType: "social-strategy", prompt: strategyPrompt, minLength: 300, costTier: "sonnet" })
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
