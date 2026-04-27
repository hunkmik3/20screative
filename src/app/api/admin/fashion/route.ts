import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import {
  loadFashionPageContent,
  saveFashionPageContent,
} from "@/lib/fashionContent";
import { isFashionPageContent } from "@/data/fashionPage";
import { syncCloudflareStreamForContent } from "@/lib/streamSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const content = await loadFashionPageContent();
  return NextResponse.json(content);
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!isFashionPageContent(body)) {
    return NextResponse.json(
      { error: "Invalid fashion page content" },
      { status: 400 },
    );
  }

  try {
    const streamSync = await syncCloudflareStreamForContent(body);
    await saveFashionPageContent(body);
    return NextResponse.json({ ok: true, streamSync });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save fashion page",
      },
      { status: 500 },
    );
  }
}
