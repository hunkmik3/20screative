import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  defaultFashionPageContent,
  isFashionPageContent,
  type FashionPageContent,
} from "@/data/fashionPage";
import { getR2Bucket, getR2Client } from "@/lib/r2";

const FASHION_CONTENT_KEY = "content/fashion-page.json";
const defaultReviewsBlock = defaultFashionPageContent.blocks.find(
  (block) => block.type === "reviews",
);

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

function withContentMigrations(
  content: FashionPageContent,
): FashionPageContent {
  if (content.blocks.some((block) => block.type === "reviews")) {
    return content;
  }

  if (!defaultReviewsBlock) return content;

  const ctaIndex = content.blocks.findIndex((block) => block.type === "cta");
  const blocks = [...content.blocks];
  const insertIndex = ctaIndex >= 0 ? ctaIndex : blocks.length;
  blocks.splice(insertIndex, 0, defaultReviewsBlock);

  return { ...content, blocks };
}

export async function loadFashionPageContent(): Promise<FashionPageContent> {
  try {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: getR2Bucket(),
        Key: FASHION_CONTENT_KEY,
      }),
    );
    const text = await bodyToText(response.Body);
    const parsed = JSON.parse(text);
    if (!isFashionPageContent(parsed)) {
      throw new Error("Invalid fashion page content");
    }
    return withContentMigrations(parsed);
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return defaultFashionPageContent;
    }

    console.warn("Using default fashion content:", error);
    return defaultFashionPageContent;
  }
}

export async function saveFashionPageContent(
  content: FashionPageContent,
): Promise<void> {
  if (!isFashionPageContent(content)) {
    throw new Error("Invalid fashion page content");
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: FASHION_CONTENT_KEY,
      Body: JSON.stringify(content, null, 2),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store",
    }),
  );
}
