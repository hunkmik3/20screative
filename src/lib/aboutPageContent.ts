import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  getDefaultAboutPageContent,
  normalizeAboutPageContent,
  type AboutPageContent,
} from "@/data/aboutPageContent";
import { getR2Bucket, getR2Client } from "@/lib/r2";

const ABOUT_CONTENT_KEY = "content/about-page-v2.json";

async function bodyToText(body: unknown): Promise<string> {
  if (
    body &&
    typeof body === "object" &&
    "transformToString" in body &&
    typeof body.transformToString === "function"
  ) {
    return body.transformToString();
  }

  throw new Error("Unsupported R2 response body");
}

export async function loadAboutPageContent(): Promise<AboutPageContent> {
  const defaultContent = getDefaultAboutPageContent();

  try {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: getR2Bucket(),
        Key: ABOUT_CONTENT_KEY,
      }),
    );
    const text = await bodyToText(response.Body);
    const parsed = JSON.parse(text);
    const normalized = normalizeAboutPageContent(parsed);
    if (!normalized) {
      throw new Error("Invalid about page content");
    }
    return normalized;
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return defaultContent;
    }

    console.warn("Using default about content:", error);
    return defaultContent;
  }
}

export async function saveAboutPageContent(
  content: AboutPageContent,
): Promise<void> {
  const normalized = normalizeAboutPageContent(content);
  if (!normalized) {
    throw new Error("Invalid about page content");
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: ABOUT_CONTENT_KEY,
      Body: JSON.stringify(normalized, null, 2),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store",
    }),
  );
}
