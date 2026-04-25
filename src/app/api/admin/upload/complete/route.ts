import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getR2Bucket, getR2Client, publicUrlFor } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    key?: string;
    uploadId?: string;
    parts?: { partNumber: number; etag: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { key, uploadId, parts } = body;
  if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
    return NextResponse.json({ error: "Missing key/uploadId/parts" }, { status: 400 });
  }

  const r2 = getR2Client();
  await r2.send(
    new CompleteMultipartUploadCommand({
      Bucket: getR2Bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    }),
  );

  return NextResponse.json({ ok: true, key, url: publicUrlFor(key) });
}
