import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  getDefaultLegacyPageContent,
  isLegacyPageContent,
  normalizeLegacyPageContent,
  type LegacyPageContentMap,
  type LegacyPageSlug,
} from "@/data/legacyPageContent";
import { getR2Bucket, getR2Client } from "@/lib/r2";

const contentKeyBySlug = (slug: LegacyPageSlug) =>
  `content/${slug}-legacy-page.json`;

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

export async function loadLegacyPageContent<K extends LegacyPageSlug>(
  slug: K,
): Promise<LegacyPageContentMap[K]> {
  const defaultContent = getDefaultLegacyPageContent(slug);

  try {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: getR2Bucket(),
        Key: contentKeyBySlug(slug),
      }),
    );
    const text = await bodyToText(response.Body);
    const parsed = JSON.parse(text);
    const normalized = normalizeLegacyPageContent(slug, parsed);
    if (!normalized) {
      throw new Error(`Invalid ${slug} legacy page content`);
    }
    return normalized;
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return defaultContent;
    }

    console.warn(`Using default ${slug} legacy content:`, error);
    return defaultContent;
  }
}

export async function saveLegacyPageContent<K extends LegacyPageSlug>(
  slug: K,
  content: LegacyPageContentMap[K],
): Promise<void> {
  if (!isLegacyPageContent(slug, content)) {
    throw new Error(`Invalid ${slug} legacy page content`);
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: contentKeyBySlug(slug),
      Body: JSON.stringify(content, null, 2),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store",
    }),
  );
}
