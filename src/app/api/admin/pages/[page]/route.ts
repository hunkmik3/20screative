import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isFashionPageContent } from "@/data/fashionPage";
import { isEditablePageSlug } from "@/data/pageContent";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { loadPageContent, savePageContent } from "@/lib/pageContent";
import { syncCloudflareStreamForContent } from "@/lib/streamSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminPageRouteContext = {
  params: Promise<{ page: string }>;
};

async function requireAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

async function getPageSlug(context: AdminPageRouteContext) {
  const { page } = await context.params;
  return page;
}

export async function GET(_req: Request, context: AdminPageRouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getPageSlug(context);
  if (!isEditablePageSlug(page)) {
    return NextResponse.json({ error: "Unknown page" }, { status: 404 });
  }

  const content = await loadPageContent(page);
  return NextResponse.json(content);
}

export async function PUT(req: Request, context: AdminPageRouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getPageSlug(context);
  if (!isEditablePageSlug(page)) {
    return NextResponse.json({ error: "Unknown page" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!isFashionPageContent(body)) {
    return NextResponse.json(
      { error: `Invalid ${page} page content` },
      { status: 400 },
    );
  }

  try {
    const streamSync = await syncCloudflareStreamForContent(body);
    await savePageContent(page, body);
    return NextResponse.json({ ok: true, streamSync });
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
