import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isLegacyPageContent,
  isLegacyPageSlug,
  normalizeLegacyPageContent,
} from "@/data/legacyPageContent";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import {
  loadLegacyPageContent,
  saveLegacyPageContent,
} from "@/lib/legacyPageContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminLegacyPageRouteContext = {
  params: Promise<{ page: string }>;
};

async function requireAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

async function getPageSlug(context: AdminLegacyPageRouteContext) {
  const { page } = await context.params;
  return page;
}

export async function GET(
  _req: Request,
  context: AdminLegacyPageRouteContext,
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getPageSlug(context);
  if (!isLegacyPageSlug(page)) {
    return NextResponse.json({ error: "Unknown legacy page" }, { status: 404 });
  }

  const content = await loadLegacyPageContent(page);
  return NextResponse.json(content);
}

export async function PUT(req: Request, context: AdminLegacyPageRouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getPageSlug(context);
  if (!isLegacyPageSlug(page)) {
    return NextResponse.json({ error: "Unknown legacy page" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const normalized = normalizeLegacyPageContent(page, body);

  if (!normalized || !isLegacyPageContent(page, normalized)) {
    return NextResponse.json(
      { error: `Invalid ${page} legacy page content` },
      { status: 400 },
    );
  }

  try {
    await saveLegacyPageContent(page, normalized);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : `Failed to save ${page} page`,
      },
      { status: 500 },
    );
  }
}
