import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      return new NextResponse("Target is not HTML", { status: 400 });
    }

    let html = await response.text();

    // Inject base tag into head so relative assets resolve properly
    const baseUrl = new URL(targetUrl).origin;
    const baseTag = `<base href="${baseUrl}/">`;
    if (html.toLowerCase().includes("<head>")) {
      html = html.replace(/<head>/i, `<head>${baseTag}`);
    } else {
      html = `${baseTag}${html}`;
    }

    // Remove anti-framing headers
    const newHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!["x-frame-options", "content-security-policy", "set-cookie"].includes(lowerKey)) {
        newHeaders.set(key, value);
      }
    });

    return new NextResponse(html, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error: any) {
    return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
  }
}
