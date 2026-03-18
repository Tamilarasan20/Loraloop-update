// ─── Postiz API Proxy Route ───
// Proxies all requests to the self-hosted Postiz backend to:
// 1. Forward auth cookies/tokens
// 2. Avoid CORS issues between Next.js (3000) and Postiz (4007)
//
// Usage: /api/postiz/posts → http://localhost:4007/api/v1/posts

import { NextRequest, NextResponse } from "next/server";

const POSTIZ_API_BASE =
  process.env.POSTIZ_API_URL || "https://api.postiz.com/public/v1";
const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY || "";

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  const routePath = route.join("/");
  const targetUrl = `${POSTIZ_API_BASE}/${routePath}${req.nextUrl.search}`;

  // Build headers to forward
  const headers: Record<string, string> = {
    Authorization: POSTIZ_API_KEY,
  };

  // Forward Content-Type if present (but not for multipart — let fetch handle it)
  const contentType = req.headers.get("content-type");
  if (contentType && !contentType.includes("multipart/form-data")) {
    headers["Content-Type"] = contentType;
  }

  try {
    let body: BodyInit | undefined;

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (contentType?.includes("multipart/form-data")) {
        // For file uploads, forward the FormData
        body = await req.formData();
      } else {
        body = await req.text();
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[Postiz Proxy Error]", error);
    return NextResponse.json(
      { error: "Failed to connect to Postiz API", details: String(error) },
      { status: 502 }
    );
  }
}

// Support all HTTP methods
export async function GET(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  return proxyRequest(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  return proxyRequest(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  return proxyRequest(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  return proxyRequest(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  return proxyRequest(req, context);
}
