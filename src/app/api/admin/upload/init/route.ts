import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getR2Bucket, getR2Client } from "@/lib/r2";

export const runtime = "nodejs";

const PART_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB safety cap

export async function POST(req: Request) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { filename?: string; contentType?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const filename = String(body.filename ?? "").trim();
  const contentType = String(body.contentType ?? "application/octet-stream");
  const size = Number(body.size);

  if (!filename || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "Missing filename or size" }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5GB)" }, { status: 413 });
  }

  // Sanitize filename and add timestamp prefix to avoid collisions
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = contentType.startsWith("image/")
    ? "images"
    : contentType.startsWith("video/")
      ? "videos"
      : "assets";
  const key = `${prefix}/${Date.now()}-${safe}`;
  const r2 = getR2Client();
  const bucket = getR2Bucket();

  // Aggressive cache + inline disposition so browsers stream + range-request
  // videos efficiently. Object keys include a timestamp so cache invalidation
  // happens automatically when admin uploads a new file.
  const isVideo = contentType.startsWith("video/");
  const isImage = contentType.startsWith("image/");
  const cacheControl =
    isVideo || isImage
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600";

  const create = await r2.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
      ContentDisposition: "inline",
    }),
  );
  const uploadId = create.UploadId;
  if (!uploadId) {
    return NextResponse.json({ error: "Failed to init upload" }, { status: 500 });
  }

  const partCount = Math.ceil(size / PART_SIZE);
  const partUrls: { partNumber: number; url: string }[] = [];
  for (let i = 1; i <= partCount; i++) {
    const url = await getSignedUrl(
      r2,
      new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: i,
      }),
      { expiresIn: 3600 },
    );
    partUrls.push({ partNumber: i, url });
  }

  return NextResponse.json({ key, uploadId, partSize: PART_SIZE, partUrls });
}
