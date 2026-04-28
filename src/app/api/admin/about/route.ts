import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeAboutPageContent } from "@/data/aboutPageContent";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import {
  loadAboutPageContent,
  saveAboutPageContent,
} from "@/lib/aboutPageContent";

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

  const content = await loadAboutPageContent();
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

  const normalized = normalizeAboutPageContent(body);
  if (!normalized) {
    return NextResponse.json(
      { error: "Invalid about page content" },
      { status: 400 },
    );
  }

  try {
    await saveAboutPageContent(normalized);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save about page",
      },
      { status: 500 },
    );
  }
}
