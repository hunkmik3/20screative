import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import {
  loadFashionPageContent,
  saveFashionPageContent,
} from "@/lib/fashionContent";
import {
  loadLegacyPageContent,
  saveLegacyPageContent,
} from "@/lib/legacyPageContent";
import { legacyPageSlugs } from "@/data/legacyPageContent";
import {
  streamSyncSummary,
  syncCloudflareStreamForContent,
  type StreamSyncStats,
} from "@/lib/streamSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = req.headers.get("authorization") ?? "";
  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true;

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

function mergeStats(items: StreamSyncStats[]) {
  return items.reduce<StreamSyncStats>(
    (total, item) => ({
      enabled: total.enabled || item.enabled,
      scanned: total.scanned + item.scanned,
      imported: total.imported + item.imported,
      relinked: total.relinked + item.relinked,
      downloadsReady: total.downloadsReady + item.downloadsReady,
      downloadsRequested: total.downloadsRequested + item.downloadsRequested,
      downloadsPending: total.downloadsPending + item.downloadsPending,
      changed: total.changed || item.changed,
      errors: [...total.errors, ...item.errors],
    }),
    {
      enabled: false,
      scanned: 0,
      imported: 0,
      relinked: 0,
      downloadsReady: 0,
      downloadsRequested: 0,
      downloadsPending: 0,
      changed: false,
      errors: [],
    },
  );
}

async function runStreamSync() {
  const details: Record<string, StreamSyncStats> = {};

  const fashion = await loadFashionPageContent();
  const fashionStats = await syncCloudflareStreamForContent(fashion);
  if (fashionStats.changed) await saveFashionPageContent(fashion);
  details.fashion = fashionStats;

  for (const slug of legacyPageSlugs) {
    const content = await loadLegacyPageContent(slug);
    const stats = await syncCloudflareStreamForContent(content);
    if (stats.changed) await saveLegacyPageContent(slug, content);
    details[slug] = stats;
  }

  const total = mergeStats(Object.values(details));
  return { ok: true, summary: streamSyncSummary(total), total, details };
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runStreamSync();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runStreamSync();
  return NextResponse.json(result);
}
