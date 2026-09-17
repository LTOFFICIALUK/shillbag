import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

const proxy = async (request: NextRequest) => {
  const target = `${API_URL}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);
  headers.set(
    "x-forwarded-host",
    request.headers.get("host") ?? request.nextUrl.host,
  );
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  headers.set("x-forwarded-origin", request.nextUrl.origin);
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  const realIp = request.headers.get("x-real-ip");
  if (realIp) headers.set("x-real-ip", realIp);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const out = new Headers();
  const contentTypeOut = upstream.headers.get("content-type");
  if (contentTypeOut) out.set("content-type", contentTypeOut);
  const location = upstream.headers.get("location");
  if (location) out.set("location", location);
  for (const value of upstream.headers.getSetCookie()) {
    out.append("set-cookie", value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: out,
  });
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
