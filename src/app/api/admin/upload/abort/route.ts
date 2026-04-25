import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getR2Bucket, getR2Client } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, uploadId } = await req.json();
  if (!key || !uploadId) {
    return NextResponse.json({ error: "Missing key/uploadId" }, { status: 400 });
  }

  const r2 = getR2Client();
  await r2.send(
    new AbortMultipartUploadCommand({
      Bucket: getR2Bucket(),
      Key: key,
      UploadId: uploadId,
    }),
  );

  return NextResponse.json({ ok: true });
}
