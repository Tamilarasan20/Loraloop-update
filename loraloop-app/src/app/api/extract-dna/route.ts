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

  // Tracking pixels & analytics
  const junk = [
    "pixel", "track", "analytics", "beacon", "1x1", "spacer",
    "facebook.com/tr", "google-analytics", "doubleclick",
    "googletagmanager", "hotjar", ".gif", "data:image/gif",
    "data:image/svg+xml", "gravatar", "wp-emoji",
    "wpcf7", "spinner", "loading.gif",
  ];
  if (junk.some((j) => lower.includes(j))) return false;

  // Placeholder image services
  const placeholders = [
    "placeholder.com", "via.placeholder.com", "placeimg.com",
    "placekitten.com", "dummyimage.com", "loremflickr.com",
    "lorempixel.com", "imagefor.me", "placeholder.pics",
  ];
  if (placeholders.some((p) => lower.includes(p))) return false;

  // Generic CDN images (often watermarks, logos)
  if (/\/(logo|watermark|badge|stamp|copyright|©)/i.test(lower)) return false;
  if (lower.endsWith(".ico") && !lower.includes("logo")) return false;
  if (/\/(icon|favicon|sprite|arrow|chevron|check|star|dot|close|menu|hamburger|button|btn)/i.test(lower)) return false;

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
      let previousHeight = 0;
      let noNewImagesCount = 0;
      const distance = 800;
      const maxNoNewImages = 3; // Stop if no new images after 3 scrolls

      const timer = setInterval(() => {
        const currentImgCount = document.querySelectorAll('img').length;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // Check for infinite scroll pattern (new images keep appearing)
        // If image count doesn't increase, might be at end
        if (currentImgCount === previousHeight) {
          noNewImagesCount++;
        } else {
          noNewImagesCount = 0;
          previousHeight = currentImgCount;
        }

        // Stop conditions:
        // 1. Reached actual end of DOM
        // 2. Hit scrolling height limit
        // 3. No new images detected (infinite scroll at end)
        if (totalHeight >= document.body.scrollHeight ||
            totalHeight > 8000 ||
            noNewImagesCount >= maxNoNewImages) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
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

    // ── SOCIAL MEDIA META TAGS — high-quality images ──
    // Strategy 0.5: Open Graph & Twitter Cards
    const socialImages: string[] = [];

    // Open Graph images (og:image, og:image:secure_url with optional dimensions)
    document.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"]')
      .forEach((tag) => {
        const url = (tag as HTMLMetaElement).content;
        if (url && url.startsWith("http")) socialImages.push(url);
      });

    // Twitter Card images
    document.querySelectorAll('meta[name^="twitter:image"]')
      .forEach((tag) => {
        const url = (tag as HTMLMetaElement).content;
        if (url && url.startsWith("http")) socialImages.push(url);
      });

    // Pinterest Rich Pin images
    document.querySelectorAll('meta[property="pinterest:media"]')
      .forEach((tag) => {
        const url = (tag as HTMLMetaElement).content;
        if (url && url.startsWith("http")) socialImages.push(url);
      });

    // ── IMAGES — aggressive multi-source capture ──

    // Strategy 1: All <img> tags with every lazy-load attribute variant
    // NOTE: data-srcset is intentionally excluded — handled by the srcset block below
    const lazyAttrs = [
      "src", "data-src", "data-lazy-src", "data-original", "data-lazy", "data-image",
      "data-bg", "data-full", "data-hi-res", "loading-src",
      // Extended: WooCommerce, Magento, custom lazy loaders
      "data-src-lg", "data-src-large", "data-lazy-load", "data-url",
      "data-img-src", "data-imgurl", "data-thumb", "data-large-file",
    ];
    for (const img of Array.from(document.querySelectorAll("img"))) {
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
    ].slice(0, 600);

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

    // Strategy 7: <noscript> fallback images — lazy-load implementations always put
    // the real full-res src inside <noscript> so non-JS scrapers can find it
    for (const ns of Array.from(document.querySelectorAll("noscript"))) {
      const raw = ns.textContent || "";
      for (const m of raw.matchAll(/src=["']([^"']+)["']/g)) {
        try { addImg(new URL(m[1], document.baseURI).href); } catch { addImg(m[1]); }
      }
    }

    // Strategy 8: JSON-LD structured data — schema.org Product / ImageObject
    for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        const walk = (obj: Record<string, unknown>): void => {
          if (!obj || typeof obj !== "object") return;
          if (Array.isArray(obj)) { (obj as unknown[]).forEach(i => walk(i as Record<string, unknown>)); return; }
          for (const [k, v] of Object.entries(obj)) {
            if (["image", "url", "contentUrl", "thumbnailUrl"].includes(k) && typeof v === "string"
              && /^https?:\/\//.test(v) && /\.(jpg|jpeg|png|webp|avif)/i.test(v)) {
              addImg(v);
            } else if (v && typeof v === "object") walk(v as Record<string, unknown>);
          }
        };
        walk(JSON.parse(script.textContent || ""));
      } catch { /* skip */ }
    }

    // Strategy 9: Product zoom / high-res data attributes (WooCommerce, Shopify, Magento zoom plugins)
    const zoomAttrs = [
      "data-zoom-image", "data-large", "data-full-src", "data-retina-src",
      "data-echo", "data-highres", "data-big", "data-photo",
      "data-original-src", "data-full-size-url", "data-zoom-src",
    ];
    const zoomSelector = zoomAttrs.map(a => `[${a}]`).join(",");
    for (const el of Array.from(document.querySelectorAll(zoomSelector))) {
      for (const attr of zoomAttrs) {
        const val = el.getAttribute(attr);
        if (val) { try { addImg(new URL(val, document.baseURI).href); } catch { addImg(val); } }
      }
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

    // Add social media images at the front (highest quality usually)
    const allImages = [...socialImages, ...images];
    const dedupedImages = Array.from(new Set(allImages));

    return {
      colors: Array.from(colors).filter((c) => c.startsWith("#")).slice(0, 25),
      fonts: Array.from(fonts).slice(0, 8),
      logoUrl,
      images: dedupedImages.slice(0, 150),
      textSample,
      pageTitle: document.title,
      internalLinks: internalLinks.slice(0, 8),
    };
  });
}

// ────────────────────────────────────────────────────────────────
// E-COMMERCE API DETECTION & SCRAPING
// ────────────────────────────────────────────────────────────────

async function scrapeEcommerceApis(origin: string): Promise<string[]> {
  const images: string[] = [];

  // Shopify product API
  try {
    const shopifyRes = await fetch(`${origin}/products.json?limit=250`, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
    });
    if (shopifyRes.ok) {
      const data = await shopifyRes.json();
      if (data.products) {
        for (const product of data.products.slice(0, 50)) {
          if (product.images) {
            for (const img of product.images.slice(0, 3)) {
              if (img.src && isUsefulImage(img.src)) images.push(img.src);
            }
          }
        }
        console.log(`[extract-dna] 🛍 Shopify API: +${images.length} images`);
      }
    }
  } catch { /* not shopify */ }

  // WooCommerce REST API
  if (images.length < 100) {
    try {
      const wcRes = await fetch(`${origin}/wp-json/wc/v3/products?per_page=100&_fields=id,images`, {
        signal: AbortSignal.timeout(6000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      });
      if (wcRes.ok) {
        const products = await wcRes.json();
        if (Array.isArray(products)) {
          for (const product of products.slice(0, 50)) {
            if (product.images) {
              for (const img of product.images.slice(0, 2)) {
                if (img.src && isUsefulImage(img.src)) images.push(img.src);
              }
            }
          }
          console.log(`[extract-dna] 🔧 WooCommerce API: +${images.length} images`);
        }
      }
    } catch { /* not woo */ }
  }

  // Magento REST API
  if (images.length < 100) {
    try {
      const magentoRes = await fetch(
        `${origin}/rest/V1/products?searchCriteria[pageSize]=100&fields=items[id,media_gallery_entries]`,
        {
          signal: AbortSignal.timeout(6000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
        }
      );
      if (magentoRes.ok) {
        const data = await magentoRes.json();
        if (data.items) {
          for (const product of data.items.slice(0, 50)) {
            if (product.media_gallery_entries) {
              for (const media of product.media_gallery_entries.slice(0, 2)) {
                if (media.file && isUsefulImage(media.file)) images.push(media.file);
              }
            }
          }
          console.log(`[extract-dna] 🏗 Magento API: +${images.length} images`);
        }
      }
    } catch { /* not magento */ }
  }

  return images;
}

// ────────────────────────────────────────────────────────────────
// IMAGE ENHANCEMENT — NETWORK, CAROUSEL, CSS, SITEMAP
// ────────────────────────────────────────────────────────────────

function extractImagesFromJson(obj: unknown, results: string[]): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) extractImagesFromJson(item, results);
    return;
  }
  for (const value of Object.values(obj as Record<string, unknown>)) {
    if (typeof value === "string" && /https?:\/\/.+\.(jpg|jpeg|png|webp|avif)/i.test(value)) {
      if (isUsefulImage(value)) results.push(value);
    } else if (value && typeof value === "object") {
      extractImagesFromJson(value, results);
    }
  }
}

async function clickCarousels(page: Page): Promise<void> {
  const nextSelectors = [
    '[class*="slick-next"]', '[class*="swiper-next"]', '[class*="carousel-next"]',
    '[class*="arrow-next"]', '[class*="arrow-right"]', '[data-slide="next"]',
    '[aria-label="Next"]', '[aria-label="Next slide"]', '[aria-label="next"]',
    'button[class*="next"]', '[class*="owl-next"]', '[class*="flickity-next"]',
  ];

  for (const sel of nextSelectors) {
    try {
      const btns = page.locator(sel);
      const count = await btns.count();

      for (let b = 0; b < Math.min(count, 5); b++) {
        const btn = btns.nth(b);
        if (await btn.isVisible({ timeout: 200 })) {
          // Click until button is disabled (not aria-disabled or disabled attribute)
          let clicks = 0;
          const maxClicks = 12; // increased from 4 to handle longer carousels

          while (clicks < maxClicks) {
            const isDisabled = await btn.evaluate((el: Element) => {
              return (el as HTMLButtonElement).disabled ||
                     el.getAttribute('aria-disabled') === 'true' ||
                     el.classList.contains('disabled');
            });

            if (isDisabled) break;

            await btn.click({ timeout: 300 });
            await page.waitForTimeout(200);
            clicks++;
          }

          // Also try keyboard navigation (arrow keys) for some carousels
          if (clicks < 3) {
            try {
              await btn.focus();
              for (let k = 0; k < 3; k++) {
                await page.keyboard.press('ArrowRight');
                await page.waitForTimeout(200);
              }
            } catch { /* keyboard nav not supported */ }
          }
        }
      }
    } catch { /* carousel not present */ }
  }
}

async function fetchExternalCssImages(page: Page): Promise<string[]> {
  const cssUrls: string[] = await page.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((l) => (l as HTMLLinkElement).href)
      .filter((h) => h.startsWith("http"))
      .slice(0, 6)
  );
  const images: string[] = [];
  await Promise.allSettled(
    cssUrls.map(async (cssUrl) => {
      try {
        const resp = await fetch(cssUrl, {
          signal: AbortSignal.timeout(4000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
        });
        if (!resp.ok) return;
        const text = await resp.text();
        for (const m of text.matchAll(/url\(["']?(https?:\/\/[^"')]+)["']?\)/g)) {
          if (isUsefulImage(m[1])) images.push(m[1]);
        }
      } catch { /* CSS fetch failed */ }
    })
  );
  return images;
}

async function fetchSitemapUrls(origin: string): Promise<string[]> {
  const sitemaps = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
  for (const sitemapUrl of sitemaps) {
    try {
      const resp = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      });
      if (!resp.ok) continue;
      const text = await resp.text();
      const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
      const useful = locs.filter((u) =>
        /\/(product|collection|gallery|shop|catalog|item|category|portfolio|about|brand)/i.test(u)
      );
      if (useful.length > 0) {
        console.log(`[extract-dna] 🗺 Sitemap: ${useful.length} useful URLs found`);
        return useful.slice(0, 6);
      }
    } catch { /* sitemap not available */ }
  }
  return [];
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

      // ── NETWORK INTERCEPTION — captures all image requests before DOM renders ──
      const networkImages: string[] = [];
      const jsonImagePromises: Promise<void>[] = [];
      page.on("response", (response) => {
        try {
          const respUrl = response.url();
          const ct = response.headers()["content-type"] || "";
          if (
            (ct.startsWith("image/jpeg") || ct.startsWith("image/png") ||
              ct.startsWith("image/webp") || ct.startsWith("image/avif") ||
              /\.(jpg|jpeg|png|webp|avif)(\?|#|$)/i.test(respUrl)) &&
            isUsefulImage(respUrl)
          ) {
            networkImages.push(respUrl);
          }
          if (
            ct.includes("application/json") &&
            !respUrl.match(/analytics|tracking|gtm|google|facebook|hotjar|segment/i)
          ) {
            const p = response.json()
              .then((json) => extractImagesFromJson(json, networkImages))
              .catch(() => {});
            jsonImagePromises.push(p);
          }
        } catch { /* */ }
      });

      // Navigate to main page — domcontentloaded is fast enough
      console.log("[extract-dna] 📄 Loading main page...");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

      // Short networkidle wait — enough for JS to render, don't over-wait
      try { await page.waitForLoadState("networkidle", { timeout: 4000 }); } catch { /* timeout ok */ }

      // Dismiss popups, scroll, then click carousels to expose hidden slides
      await dismissPopups(page);
      console.log("[extract-dna] 📜 Scrolling...");
      await autoScroll(page);
      await clickCarousels(page);
      await page.waitForTimeout(300);

      const mainData = await scrapePage(page);

      extractedColors = mainData.colors;
      extractedFonts = mainData.fonts;
      extractedLogo = mainData.logoUrl;
      extractedImages = [...mainData.images];
      textSample = mainData.textSample;
      pageTitle = mainData.pageTitle;

      console.log(`[extract-dna] ✅ Main page: ${extractedImages.length} images, ${extractedColors.length} colors`);

      // ── SUB-PAGE CRAWLER — reused for nav links and sitemap pages ──
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

      // ── CRAWL NAV PAGES + PARSE CSS + FETCH SITEMAP + E-COMMERCE APIs — all in parallel ──
      const internalLinks = mainData.internalLinks.slice(0, 4);
      const origin = new URL(url).origin;
      if (internalLinks.length > 0) {
        console.log(`[extract-dna] 🔗 Crawling ${internalLinks.length} sub-pages in parallel...`);
      }

      const [subResults, cssImages, sitemapUrls, ecommerceImages] = await Promise.all([
        Promise.allSettled(internalLinks.map(scrapeSubPage)),
        fetchExternalCssImages(page).catch(() => [] as string[]),
        fetchSitemapUrls(origin).catch(() => [] as string[]),
        scrapeEcommerceApis(origin).catch(() => [] as string[]),
      ]);

      // Merge sub-page results
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

      // Merge external CSS background images
      for (const img of cssImages) {
        if (!extractedImages.includes(img)) extractedImages.push(img);
      }
      if (cssImages.length > 0) console.log(`[extract-dna] 🎨 CSS: +${cssImages.length} images`);

      // Merge e-commerce API images
      for (const img of ecommerceImages) {
        if (!extractedImages.includes(img)) extractedImages.push(img);
      }

      // Crawl top sitemap product/gallery pages not already visited
      if (sitemapUrls.length > 0) {
        const crawledUrls = new Set([url, ...internalLinks]);
        const sitemapTargets = sitemapUrls.filter((u) => !crawledUrls.has(u)).slice(0, 4);
        if (sitemapTargets.length > 0) {
          console.log(`[extract-dna] 🗺 Crawling ${sitemapTargets.length} sitemap pages...`);
          const sitemapCrawlResults = await Promise.allSettled(sitemapTargets.map(scrapeSubPage));
          for (const result of sitemapCrawlResults) {
            if (result.status !== "fulfilled" || !result.value) continue;
            for (const img of result.value.images) {
              if (!extractedImages.includes(img)) extractedImages.push(img);
            }
          }
        }
      }

      // Flush pending JSON API promises then merge all network-intercepted images
      await Promise.allSettled(jsonImagePromises);
      for (const img of networkImages) {
        if (!extractedImages.includes(img)) extractedImages.push(img);
      }
      console.log(`[extract-dna] 🌐 Network: +${networkImages.length} images`);

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
    // Quality score: rewards high-res size cues, content-type hints, modern formats;
    // penalises thumbnails, icons, and explicitly small dimensions.
    const scoreImage = (u: string): number => {
      const lower = u.toLowerCase();
      let score = 0;
      const dimMatch = u.match(/[_-](\d{3,4})x(\d{3,4})/i);
      if (dimMatch) {
        const w = parseInt(dimMatch[1]), h = parseInt(dimMatch[2]);
        if (w >= 1200 || h >= 1200) score += 30;
        else if (w >= 800 || h >= 800) score += 20;
        else if (w >= 400 || h >= 400) score += 5;
        else score -= 15;
      }
      const wMatch = u.match(/[?&](?:w|width)=(\d+)/i);
      if (wMatch) {
        const w = parseInt(wMatch[1]);
        if (w >= 1200) score += 25;
        else if (w >= 800) score += 15;
        else if (w >= 400) score += 5;
        else if (w < 200) score -= 20;
      }
      if (/\.(webp|avif)(\?|$)/i.test(u)) score += 4;
      if (/\/(product|hero|banner|feature|gallery|portfolio|campaign|lifestyle|collection|look|editorial|showcase)/i.test(lower)) score += 18;
      if (/\/(about|brand|identity|team|story|culture)/i.test(lower)) score += 10;
      if (/\/(images?|img|media|photos?|assets?|uploads?|static)\//i.test(lower)) score += 5;
      if (/zoom|retina|highres|fullsize|full[_-]?size|hi[_-]?res|@2x|@3x/i.test(lower)) score += 15;
      if (/thumbnail|thumb|\bsmall\b|\bmini\b|[_-]sm[_-]|[_-]xs[_-]/i.test(lower)) score -= 25;
      if (/[_-](50|75|80|100|120|150)x/i.test(u)) score -= 20;
      if (/icon|sprite|arrow|check|star|dot|close|menu/i.test(lower)) score -= 30;
      return score;
    };

    extractedImages = extractedImages.filter(isUsefulImage);

    // Sort by quality score before dedup so the best variant of each image wins
    extractedImages.sort((a, b) => scoreImage(b) - scoreImage(a));
    const seenNormalized = new Set<string>();
    const deduped: string[] = [];
    for (const img of extractedImages) {
      const key = normalizeImageUrl(img);
      if (!seenNormalized.has(key)) {
        seenNormalized.add(key);
        deduped.push(img);
      }
    }
    extractedImages = deduped.slice(0, 150);

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
2. Map the scraped hex colors to the semantic color roles intelligently.
3. tagline should be extracted from the hero section text if possible.
4. All fields MUST be filled with real, accurate data. NO placeholder or generic text.
5. businessOverview must describe the ACTUAL products/services mentioned.
6. If extracted fonts are system fonts, suggest the closest Google Font equivalent.
7. Return ONLY the JSON object. No other text.`;

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
      businessProfile: `You are a senior brand analyst. Using ONLY information from the website text below, write a detailed Business Profile document in markdown.

${brandContext}

Write the Business Profile with these exact sections:
# ${parsedDna.brandName} – Business Profile

## Overview
2-3 paragraphs: what the business does, mission, founding story if mentioned, market positioning.

## Products & Services
List every product or service mentioned with a short description of each.

## Key Selling Points
5-8 bullet points of the most compelling reasons to choose this brand.

## Retail Presence
Where products are sold — online store, retailers, marketplaces, physical locations.

## Target Audience
Demographics, psychographics, interests based on the website tone and content.

Rules: Only facts from website text. Use ## headers, - bullets, **bold** key terms. Min 400 words.`,

      marketResearch: `You are a senior market researcher. Write a comprehensive Market Research document in markdown.

${brandContext}

Write the Market Research with these exact sections:
# ${parsedDna.brandName} – Market Research

## Market Opportunity
The market this brand operates in, current trends, growth indicators, why now is a good time.

## Competitive Landscape
List 8-10 REAL named competitor companies. For each, 1-2 lines on what they do and how they compare.

## SEO & GEO Keywords
15-20 high-value search keywords grouped by intent (informational, commercial, transactional).

## Target Audiences on Social
4-5 distinct audience segments — platform preferences, what content resonates, how to reach them.

Rules: Real named competitors only. Use ## headers, - bullets, **bold** key names. Min 500 words.`,

      strategy: `You are a senior social media strategist. Write a detailed Social Media Strategy document in markdown.

${brandContext}

Write the Social Media Strategy with these exact sections:
# ${parsedDna.brandName} – Social Media Strategy

## Priority Platforms
Top 3-4 platforms — why each is a priority, audience, and content format.

## Content Pillars
4-6 content themes with name, description, 2-3 example post ideas each.

## Posting Cadence
Recommended posting frequency per platform.

## Messaging Hierarchy
3-4 core messages ranked by priority — lead message, secondary hooks, proof points.

## Quick Wins
5-7 immediately actionable tactics for the next 30 days.

Rules: Specific to ${parsedDna.brandName}'s industry. Tone of voice: ${parsedDna.toneOfVoice}. Min 500 words.`,
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
