import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  isFashionPageContent,
  type FashionPageContent,
} from "@/data/fashionPage";
import {
  getDefaultPageContent,
  type EditablePageSlug,
} from "@/data/pageContent";
import { getR2Bucket, getR2Client } from "@/lib/r2";

const contentKeyBySlug = (slug: EditablePageSlug) =>
  `content/${slug}-page.json`;
const fashionIntroYoutubePlaylistUrl =
  "https://youtube.com/playlist?list=PLF0FMJSdi0xiOQHy4eLwZa0cz4T6HpIin&si=KTdqY1tk2gbf-KgC";

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
  slug: EditablePageSlug,
  content: FashionPageContent,
): FashionPageContent {
  let nextContent = content;

  // Keep legacy Fashion intro CTA in sync with the current YouTube destination.
  if (slug === "fashion") {
    const migratedBlocks = nextContent.blocks.map((block) => {
      if (
        block.id === "intro-fashion" &&
        block.ctaHref === "#fashion-spring-summer"
      ) {
        return { ...block, ctaHref: fashionIntroYoutubePlaylistUrl };
      }
      return block;
    });
    nextContent = { ...nextContent, blocks: migratedBlocks };
  }

  const defaultContent = getDefaultPageContent(slug);

  if (nextContent.blocks.some((block) => block.type === "reviews")) {
    return nextContent;
  }

  const defaultReviewsBlock = defaultContent.blocks.find(
    (block) => block.type === "reviews",
  );
  if (!defaultReviewsBlock) return nextContent;

  const blocks = [...nextContent.blocks];
  const ctaIndex = blocks.findIndex((block) => block.type === "cta");
  blocks.splice(
    ctaIndex >= 0 ? ctaIndex : blocks.length,
    0,
    defaultReviewsBlock,
  );

  return { ...nextContent, blocks };
}

export async function loadPageContent(
  slug: EditablePageSlug,
): Promise<FashionPageContent> {
  const defaultContent = getDefaultPageContent(slug);

  try {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: getR2Bucket(),
        Key: contentKeyBySlug(slug),
      }),
    );
    const text = await bodyToText(response.Body);
    const parsed = JSON.parse(text);
    if (!isFashionPageContent(parsed)) {
      throw new Error(`Invalid ${slug} page content`);
    }
    return withContentMigrations(slug, parsed);
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return defaultContent;
    }

    console.warn(`Using default ${slug} content:`, error);
    return defaultContent;
  }
}

export async function savePageContent(
  slug: EditablePageSlug,
  content: FashionPageContent,
): Promise<void> {
  if (!isFashionPageContent(content)) {
    throw new Error(`Invalid ${slug} page content`);
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
