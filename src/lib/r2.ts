import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export const R2_BUCKET = process.env.R2_BUCKET ?? "";
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

export function getR2Client(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local",
    );
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

export function getR2Bucket(): string {
  if (!R2_BUCKET) throw new Error("R2_BUCKET not set");
  return R2_BUCKET;
}

export function publicUrlFor(key: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL not set");
  }
  return `${R2_PUBLIC_URL}/${encodeURI(key)}`;
}
