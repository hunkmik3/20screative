import { R2_PUBLIC_URL } from "@/lib/r2";

const VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|webm)(?:[?#].*)?$/i;

type SyncableRecord = Record<string, unknown> & {
  id?: unknown;
  title?: unknown;
  mediaKind?: unknown;
  mediaUrl?: unknown;
  videoUrl?: unknown;
  streamUid?: unknown;
  streamSourceUrl?: unknown;
};

interface StreamVideoRef {
  pointer: string;
  title: string;
  sourceUrl: string;
  streamUid: string;
  streamSourceUrl: string;
  node: SyncableRecord;
}

interface StreamConfig {
  accountId: string;
  apiToken: string;
}

export interface StreamSyncStats {
  enabled: boolean;
  scanned: number;
  imported: number;
  relinked: number;
  downloadsReady: number;
  downloadsRequested: number;
  downloadsPending: number;
  changed: boolean;
  errors: string[];
}

function emptyStats(enabled: boolean): StreamSyncStats {
  return {
    enabled,
    scanned: 0,
    imported: 0,
    relinked: 0,
    downloadsReady: 0,
    downloadsRequested: 0,
    downloadsPending: 0,
    changed: false,
    errors: [],
  };
}

function getConfig(): StreamConfig | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken };
}

function isYoutubeUrl(value: string) {
  return /(?:youtube\.com|youtu\.be)/i.test(value);
}

function isCloudflareStreamUrl(value: string) {
  return /(?:cloudflarestream\.com|videodelivery\.net)/i.test(value);
}

function isVideoImportCandidate(value: unknown) {
  if (typeof value !== "string") return false;
  const clean = value.trim();
  if (!/^https?:\/\//i.test(clean)) return false;
  if (isYoutubeUrl(clean) || isCloudflareStreamUrl(clean)) return false;
  if (R2_PUBLIC_URL && clean.startsWith(R2_PUBLIC_URL)) return true;
  return VIDEO_EXTENSIONS.test(clean);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sourceUrlForNode(node: SyncableRecord) {
  if (isVideoImportCandidate(node.videoUrl)) {
    return stringValue(node.videoUrl);
  }

  if (node.mediaKind === "video" && isVideoImportCandidate(node.mediaUrl)) {
    return stringValue(node.mediaUrl);
  }

  return "";
}

function titleForNode(node: SyncableRecord, sourceUrl: string) {
  const title = stringValue(node.title);
  if (title) return title;
  const id = stringValue(node.id);
  if (id) return id;

  try {
    const parsed = new URL(sourceUrl);
    return decodeURIComponent(parsed.pathname.split("/").pop() ?? "") || "Video";
  } catch {
    return "Video";
  }
}

function collectStreamVideoRefs(root: unknown) {
  const refs: StreamVideoRef[] = [];
  const seen = new WeakSet<object>();

  function visit(node: unknown, pointer: string) {
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${pointer}/${index}`));
      return;
    }

    const record = node as SyncableRecord;
    const sourceUrl = sourceUrlForNode(record);
    const streamUid = stringValue(record.streamUid);
    const streamSourceUrl = stringValue(record.streamSourceUrl);

    if (sourceUrl || streamUid) {
      refs.push({
        pointer,
        title: titleForNode(record, sourceUrl),
        sourceUrl,
        streamUid,
        streamSourceUrl,
        node: record,
      });
    }

    Object.entries(record).forEach(([key, value]) => {
      if (value && typeof value === "object") visit(value, `${pointer}/${key}`);
    });
  }

  visit(root, "");
  return refs;
}

async function cloudflareStreamRequest<T>({
  config,
  path,
  method,
  body,
}: {
  config: StreamConfig;
  path: string;
  method: "GET" | "POST";
  body?: unknown;
}) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    },
  );

  const json = (await response.json().catch(() => null)) as
    | {
        success?: boolean;
        result?: T;
        errors?: { message?: string }[];
        messages?: { message?: string }[];
      }
    | null;

  if (!response.ok || !json?.success) {
    const details =
      json?.errors?.map((error) => error.message).filter(Boolean).join("; ") ||
      json?.messages
        ?.map((message) => message.message)
        .filter(Boolean)
        .join("; ") ||
      `Cloudflare Stream request failed with ${response.status}`;
    throw new Error(details);
  }

  return json.result as T;
}

async function copyToStream(config: StreamConfig, ref: StreamVideoRef) {
  const result = await cloudflareStreamRequest<{ uid?: string }>({
    config,
    path: "/copy",
    method: "POST",
    body: {
      url: ref.sourceUrl,
      meta: { name: ref.title },
    },
  });

  const uid = result?.uid?.trim();
  if (!uid) throw new Error("Cloudflare Stream response did not include uid");
  return uid;
}

type DownloadInfo = {
  status?: "ready" | "inprogress" | "error";
  url?: string;
  percentComplete?: number;
  percent_complete?: number;
};

type DownloadResponse = {
  default?: DownloadInfo;
};

async function ensureDownload(config: StreamConfig, streamUid: string) {
  let result = await cloudflareStreamRequest<DownloadResponse>({
    config,
    path: `/${streamUid}/downloads`,
    method: "GET",
  });

  let download = result?.default;
  if (download?.status === "ready") return "ready" as const;
  if (download?.status === "inprogress") return "pending" as const;

  result = await cloudflareStreamRequest<DownloadResponse>({
    config,
    path: `/${streamUid}/downloads`,
    method: "POST",
  });

  download = result?.default;
  if (download?.status === "ready") return "ready" as const;
  return "requested" as const;
}

function shouldRelink(ref: StreamVideoRef) {
  return Boolean(
    ref.streamUid &&
      ref.sourceUrl &&
      ref.streamSourceUrl &&
      ref.streamSourceUrl !== ref.sourceUrl,
  );
}

export async function syncCloudflareStreamForContent(
  content: unknown,
): Promise<StreamSyncStats> {
  const config = getConfig();
  const stats = emptyStats(Boolean(config));
  if (!config) return stats;

  const refs = collectStreamVideoRefs(content);
  stats.scanned = refs.length;

  const uidDownloadChecked = new Set<string>();

  for (const ref of refs) {
    try {
      const needsImport = Boolean(ref.sourceUrl && !ref.streamUid);
      const needsRelink = shouldRelink(ref);

      if (needsImport || needsRelink) {
        const uid = await copyToStream(config, ref);
        ref.node.streamUid = uid;
        ref.node.streamSourceUrl = ref.sourceUrl;
        ref.streamUid = uid;
        ref.streamSourceUrl = ref.sourceUrl;
        stats.changed = true;
        if (needsRelink) stats.relinked += 1;
        else stats.imported += 1;
      } else if (ref.streamUid && ref.sourceUrl && !ref.streamSourceUrl) {
        ref.node.streamSourceUrl = ref.sourceUrl;
        ref.streamSourceUrl = ref.sourceUrl;
        stats.changed = true;
      }

      const uid = stringValue(ref.node.streamUid);
      if (!uid || uidDownloadChecked.has(uid)) continue;
      uidDownloadChecked.add(uid);

      try {
        const status = await ensureDownload(config, uid);
        if (status === "ready") stats.downloadsReady += 1;
        else if (status === "pending") stats.downloadsPending += 1;
        else stats.downloadsRequested += 1;
      } catch (error) {
        stats.downloadsPending += 1;
        stats.errors.push(
          `${ref.pointer || "/"} (${ref.title}): ${
            error instanceof Error ? error.message : "download not ready"
          }`,
        );
      }
    } catch (error) {
      stats.errors.push(
        `${ref.pointer || "/"} (${ref.title}): ${
          error instanceof Error ? error.message : "stream sync failed"
        }`,
      );
    }
  }

  return stats;
}

export function streamSyncSummary(stats: StreamSyncStats) {
  if (!stats.enabled) return "Cloudflare Stream sync disabled";
  return [
    `${stats.scanned} scanned`,
    `${stats.imported} imported`,
    `${stats.relinked} relinked`,
    `${stats.downloadsReady} ready`,
    `${stats.downloadsRequested} requested`,
    `${stats.downloadsPending} pending`,
    `${stats.errors.length} warning(s)`,
  ].join(", ");
}
