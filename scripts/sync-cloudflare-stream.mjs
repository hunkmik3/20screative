#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const CONTENT_KEYS = {
  fashion: "content/fashion-page.json",
  commercial: "content/commercial-legacy-page.json",
  sport: "content/sport-legacy-page.json",
};

const VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|webm)(?:[?#].*)?$/i;

function loadDotEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }

  for (const line of text.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#") || !clean.includes("=")) continue;
    const index = clean.indexOf("=");
    const key = clean.slice(0, index).trim();
    const value = clean.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function argValue(name) {
  const prefix = `${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function pagesFromArgs() {
  const pages = argValue("--pages");
  if (!pages) return Object.keys(CONTENT_KEYS);
  return pages
    .split(",")
    .map((page) => page.trim())
    .filter((page) => page in CONTENT_KEYS);
}

function bodyToText(body) {
  if (body && typeof body.transformToString === "function") {
    return body.transformToString();
  }
  throw new Error("Unsupported R2 response body");
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function isYoutubeUrl(value) {
  return /(?:youtube\.com|youtu\.be)/i.test(value);
}

function isCloudflareStreamUrl(value) {
  return /(?:cloudflarestream\.com|videodelivery\.net)/i.test(value);
}

function isVideoImportCandidate(value) {
  if (!value || typeof value !== "string") return false;
  const clean = value.trim();
  if (!/^https?:\/\//i.test(clean)) return false;
  if (isYoutubeUrl(clean) || isCloudflareStreamUrl(clean)) return false;
  if (process.env.R2_PUBLIC_URL && clean.startsWith(process.env.R2_PUBLIC_URL)) {
    return true;
  }
  return VIDEO_EXTENSIONS.test(clean);
}

function videoUrlForNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return "";
  if (isVideoImportCandidate(node.videoUrl)) return node.videoUrl.trim();
  if (node.mediaKind === "video" && isVideoImportCandidate(node.mediaUrl)) {
    return node.mediaUrl.trim();
  }
  return "";
}

function streamUidForNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return "";
  if (typeof node.streamUid !== "string") return "";
  return node.streamUid.trim();
}

function nameFromUrl(url, fallback) {
  try {
    const parsed = new URL(url);
    const file = decodeURIComponent(parsed.pathname.split("/").pop() ?? "");
    return file || fallback;
  } catch {
    return fallback;
  }
}

function collectCandidates(root, page) {
  const candidates = [];
  const seenObjects = new WeakSet();

  function visit(node, pointer) {
    if (!node || typeof node !== "object") return;
    if (seenObjects.has(node)) return;
    seenObjects.add(node);

    if (!Array.isArray(node)) {
      const url = videoUrlForNode(node);
      const hasStreamUid =
        typeof node.streamUid === "string" && node.streamUid.trim();

      if (url && !hasStreamUid) {
        candidates.push({
          page,
          pointer,
          title: String(node.title || node.id || nameFromUrl(url, "Video")),
          url,
          node,
        });
      }
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${pointer}/${index}`));
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === "object") visit(value, `${pointer}/${key}`);
    }
  }

  visit(root, "");
  return candidates;
}

function collectStreamVideos(root, page) {
  const videos = [];
  const seenObjects = new WeakSet();

  function visit(node, pointer) {
    if (!node || typeof node !== "object") return;
    if (seenObjects.has(node)) return;
    seenObjects.add(node);

    if (!Array.isArray(node)) {
      const uid = streamUidForNode(node);
      if (uid) {
        const url =
          typeof node.videoUrl === "string"
            ? node.videoUrl.trim()
            : typeof node.mediaUrl === "string"
              ? node.mediaUrl.trim()
              : "";
        videos.push({
          page,
          pointer,
          title: String(node.title || node.id || "Video"),
          uid,
          url,
          node,
        });
      }
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${pointer}/${index}`));
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === "object") visit(value, `${pointer}/${key}`);
    }
  }

  visit(root, "");
  return videos;
}

function uniqueByUid(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.uid)) return false;
    seen.add(item.uid);
    return true;
  });
}

async function loadContent(client, bucket, key) {
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const text = await bodyToText(response.Body);
  return JSON.parse(text);
}

async function saveContent(client, bucket, key, content) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(content, null, 2),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store",
    }),
  );
}

async function copyToStream({ accountId, apiToken, url, title }) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        meta: { name: title || nameFromUrl(url, "Video") },
      }),
    },
  );

  const json = await response.json();
  if (!response.ok || !json.success) {
    const message =
      json.errors?.map((error) => error.message).join("; ") ||
      `Cloudflare Stream copy failed with ${response.status}`;
    throw new Error(message);
  }

  const uid = json.result?.uid;
  if (!uid) throw new Error("Cloudflare Stream response did not include uid");
  return uid;
}

async function streamApiRequest({ accountId, apiToken, uid, method, suffix = "" }) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}${suffix}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  );

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (response.status === 404) return null;

  if (!response.ok || !json?.success) {
    const message =
      json?.errors?.map((error) => error.message).join("; ") ||
      `Cloudflare Stream request failed with ${response.status}`;
    throw new Error(message);
  }

  return json.result ?? null;
}

function defaultDownloadFrom(result) {
  return result?.default ?? null;
}

function downloadPercent(download) {
  return download?.percentComplete ?? download?.percent_complete ?? 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureStreamDownload({
  accountId,
  apiToken,
  uid,
  title,
  wait,
  timeoutMs,
  pollMs,
}) {
  let result = await streamApiRequest({
    accountId,
    apiToken,
    uid,
    method: "GET",
    suffix: "/downloads",
  });
  let download = defaultDownloadFrom(result);

  if (download?.status === "ready") {
    console.log(`  mp4 ready: ${download.url}`);
    return download;
  }

  if (!download || download.status === "error") {
    console.log(`  creating mp4 download: ${title}`);
    result = await streamApiRequest({
      accountId,
      apiToken,
      uid,
      method: "POST",
      suffix: "/downloads",
    });
    download = defaultDownloadFrom(result);
  }

  if (!wait || download?.status === "ready") {
    const status = download?.status ?? "requested";
    const percent = downloadPercent(download);
    console.log(`  mp4 ${status}: ${percent}%`);
    return download;
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = download?.status ?? "requested";
    const percent = downloadPercent(download);
    process.stdout.write(`  mp4 ${status}: ${percent}%\r`);

    if (download?.status === "ready") {
      process.stdout.write("\n");
      console.log(`  mp4 ready: ${download.url}`);
      return download;
    }

    if (download?.status === "error") {
      process.stdout.write("\n");
      throw new Error("Cloudflare Stream MP4 download generation failed");
    }

    await sleep(pollMs);
    result = await streamApiRequest({
      accountId,
      apiToken,
      uid,
      method: "GET",
      suffix: "/downloads",
    });
    download = defaultDownloadFrom(result);
  }

  process.stdout.write("\n");
  console.log("  mp4 still processing; re-run with --downloads-only later.");
  return download;
}

async function main() {
  loadDotEnvLocal();

  const dryRun = hasArg("--dry-run");
  const downloadsOnly = hasArg("--downloads-only");
  const skipDownloads = hasArg("--skip-downloads");
  const waitDownloads = hasArg("--wait-downloads") || downloadsOnly;
  const downloadTimeoutMs =
    Number.parseInt(argValue("--download-timeout-ms") ?? "", 10) || 120_000;
  const downloadPollMs =
    Number.parseInt(argValue("--download-poll-ms") ?? "", 10) || 5_000;
  const pages = pagesFromArgs();
  const limit = Number.parseInt(argValue("--limit") ?? "", 10);
  const maxImports = Number.isFinite(limit) && limit > 0 ? limit : Infinity;

  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("Missing R2_BUCKET");

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!dryRun && (!accountId || !apiToken)) {
    throw new Error(
      "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN. Add them to .env.local or export them before running.",
    );
  }

  const client = getR2Client();
  const loadedPages = [];
  const allCandidates = [];
  const existingStreamVideos = [];

  for (const page of pages) {
    const key = CONTENT_KEYS[page];
    try {
      const content = await loadContent(client, bucket, key);
      const candidates = collectCandidates(content, page);
      const streamVideos = collectStreamVideos(content, page);
      loadedPages.push({ page, key, content, candidates });
      allCandidates.push(...candidates);
      existingStreamVideos.push(...streamVideos);
    } catch (error) {
      if (error instanceof NoSuchKey || error?.name === "NoSuchKey") {
        console.warn(`[skip] ${key} does not exist in R2 yet`);
        continue;
      }
      throw error;
    }
  }

  if (downloadsOnly) {
    const videos = uniqueByUid(existingStreamVideos);
    if (videos.length === 0) {
      console.log("No existing streamUid values were found.");
      return;
    }

    console.log(
      `Found ${videos.length} existing Cloudflare Stream video(s) across ${loadedPages.length} page(s).`,
    );
    videos.forEach((item, index) => {
      console.log(
        `${String(index + 1).padStart(2, "0")}. [${item.page}] ${item.pointer || "/"} - ${item.title}`,
      );
      console.log(`    uid: ${item.uid}`);
    });

    if (dryRun) {
      console.log("\nDry run only. Re-run without --dry-run to create MP4 downloads.");
      return;
    }

    const pagesWithSourceBackfill = new Set();
    for (const item of videos) {
      if (item.url && !item.node.streamSourceUrl) {
        item.node.streamSourceUrl = item.url;
        pagesWithSourceBackfill.add(item.page);
      }
    }

    for (const item of videos) {
      console.log(`\nChecking MP4 download: ${item.title}`);
      try {
        await ensureStreamDownload({
          accountId,
          apiToken,
          uid: item.uid,
          title: item.title,
          wait: waitDownloads,
          timeoutMs: downloadTimeoutMs,
          pollMs: downloadPollMs,
        });
      } catch (error) {
        console.warn(
          `  skipped for now: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    for (const { page, key, content } of loadedPages) {
      if (!pagesWithSourceBackfill.has(page)) continue;
      await saveContent(client, bucket, key, content);
      console.log(`Saved ${key} with streamSourceUrl backfill`);
    }

    console.log("\nDone. Existing Stream videos now have MP4 downloads requested.");
    return;
  }

  if (allCandidates.length === 0) {
    console.log("No videos missing streamUid were found.");
    return;
  }

  console.log(
    `Found ${allCandidates.length} video(s) missing streamUid across ${loadedPages.length} page(s).`,
  );
  allCandidates.forEach((item, index) => {
    console.log(
      `${String(index + 1).padStart(2, "0")}. [${item.page}] ${item.pointer || "/"} - ${item.title}`,
    );
    console.log(`    ${item.url}`);
  });

  if (dryRun) {
    console.log("\nDry run only. Re-run without --dry-run to import to Stream.");
    return;
  }

  const uidByUrl = new Map();
  const downloadsByUid = new Set();
  let imported = 0;

  for (const item of allCandidates) {
    if (imported >= maxImports) break;

    let uid = uidByUrl.get(item.url);
    if (!uid) {
      console.log(`\nImporting: ${item.title}`);
      uid = await copyToStream({
        accountId,
        apiToken,
        url: item.url,
        title: nameFromUrl(item.url, item.title),
      });
      uidByUrl.set(item.url, uid);
      imported += 1;
      console.log(`  uid: ${uid}`);
    } else {
      console.log(`\nReusing uid for duplicate URL: ${item.title}`);
      console.log(`  uid: ${uid}`);
    }

    item.node.streamUid = uid;
    item.node.streamSourceUrl = item.url;

    if (!skipDownloads && !downloadsByUid.has(uid)) {
      downloadsByUid.add(uid);
      try {
        await ensureStreamDownload({
          accountId,
          apiToken,
          uid,
          title: item.title,
          wait: waitDownloads,
          timeoutMs: downloadTimeoutMs,
          pollMs: downloadPollMs,
        });
      } catch (error) {
        console.warn(
          `  mp4 download not ready yet: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  for (const { key, content, candidates } of loadedPages) {
    if (!candidates.some((item) => item.node.streamUid)) continue;
    await saveContent(client, bucket, key, content);
    console.log(`Saved ${key}`);
  }

  console.log(
    "\nDone. Cloudflare Stream may continue encoding or generating MP4 downloads in the background.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
