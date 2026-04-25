export type FashionMediaKind = "image" | "video";

export type FashionBlockType =
  | "hero"
  | "statement"
  | "feature"
  | "mediaPair"
  | "carousel"
  | "projectGrid"
  | "reviews"
  | "cta";

export interface FashionMediaItem {
  id: string;
  title: string;
  subtitle?: string;
  mediaUrl: string;
  mediaKind: FashionMediaKind;
  posterUrl?: string;
  videoUrl?: string;
  href?: string;
  meta?: string;
  aspect?: "portrait" | "landscape" | "square";
}

export interface FashionBlock {
  id: string;
  type: FashionBlockType;
  kicker?: string;
  title: string;
  subtitle?: string;
  body?: string;
  mediaUrl?: string;
  mediaKind?: FashionMediaKind;
  posterUrl?: string;
  videoUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items?: FashionMediaItem[];
}

export interface FashionPageContent {
  version: 1;
  title: string;
  description: string;
  blocks: FashionBlock[];
}

export const fashionBlockTypes: FashionBlockType[] = [
  "hero",
  "statement",
  "feature",
  "mediaPair",
  "carousel",
  "projectGrid",
  "reviews",
  "cta",
];

export const defaultFashionPageContent: FashionPageContent = {
  version: 1,
  title: "Fashion",
  description:
    "Fashion films, editorials, runway stories, and campaign worlds by 20sCreative.",
  blocks: [
    {
      id: "hero-fashion-2026",
      type: "hero",
      kicker: "20sCreative",
      title: "Fashion Film",
      subtitle: "Spring Summer 2026",
      mediaUrl: "https://picsum.photos/seed/fashion-editorial-hero/1800/1100",
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem video",
    },
    {
      id: "statement-fashion",
      type: "statement",
      kicker: "Direction",
      title: "Material, movement, and the space between image and film.",
      body:
        "Each project is structured as an editorial system: a lead film, campaign stills, portrait details, and short visual chapters that can live together on one continuous page.",
    },
    {
      id: "feature-spring",
      type: "feature",
      kicker: "Featured Film",
      title: "Spring/Summer Collection 2025",
      subtitle: "A study of texture, silhouette, and controlled motion.",
      body:
        "The opening film sets the tone for the collection, followed by still frames and short-form edits designed for social, web, and showroom screens.",
      mediaUrl: "https://picsum.photos/seed/fashion-feature-01/1200/1500",
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Watch film",
    },
    {
      id: "pair-runway",
      type: "mediaPair",
      title: "Runway Fragments",
      subtitle: "Two visual chapters from the same campaign world.",
      items: [
        {
          id: "pair-runway-1",
          title: "Backstage",
          subtitle: "A quiet look at preparation and texture.",
          mediaUrl: "https://picsum.photos/seed/fashion-pair-01/900/1200",
          mediaKind: "image",
          aspect: "portrait",
        },
        {
          id: "pair-runway-2",
          title: "On Set",
          subtitle: "Movement tests and precise camera blocking.",
          mediaUrl: "https://picsum.photos/seed/fashion-pair-02/900/1200",
          mediaKind: "image",
          aspect: "portrait",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
      ],
    },
    {
      id: "carousel-looks",
      type: "carousel",
      kicker: "Campaign Cuts",
      title: "Selected Sequences",
      subtitle:
        "A horizontal sequence of films and still-led stories from fashion campaigns.",
      items: [
        {
          id: "look-01",
          title: "Look 01",
          subtitle: "Soft tailoring in motion",
          mediaUrl: "https://picsum.photos/seed/fashion-look-01/900/1200",
          mediaKind: "image",
          aspect: "portrait",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "look-02",
          title: "Look 02",
          subtitle: "Editorial close-up",
          mediaUrl: "https://picsum.photos/seed/fashion-look-02/900/1200",
          mediaKind: "image",
          aspect: "portrait",
        },
        {
          id: "look-03",
          title: "Look 03",
          subtitle: "Runway rhythm",
          mediaUrl: "https://picsum.photos/seed/fashion-look-03/900/1200",
          mediaKind: "image",
          aspect: "portrait",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "look-04",
          title: "Look 04",
          subtitle: "Studio silhouette",
          mediaUrl: "https://picsum.photos/seed/fashion-look-04/900/1200",
          mediaKind: "image",
          aspect: "portrait",
        },
      ],
    },
    {
      id: "fashion-projects",
      type: "projectGrid",
      kicker: "Projects",
      title: "Fashion Projects",
      subtitle: "Multiple campaigns shown together on one continuous page.",
      items: [
        {
          id: "project-01",
          title: "In Motion",
          subtitle: "Fashion film and campaign stills",
          mediaUrl: "https://picsum.photos/seed/fashion-project-01/1200/800",
          mediaKind: "image",
          aspect: "landscape",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "project-02",
          title: "Behind The Runway",
          subtitle: "Backstage film study",
          mediaUrl: "https://picsum.photos/seed/fashion-project-02/900/1200",
          mediaKind: "image",
          aspect: "portrait",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "project-03",
          title: "Urban Streetwear",
          subtitle: "Editorial campaign",
          mediaUrl: "https://picsum.photos/seed/fashion-project-03/1200/900",
          mediaKind: "image",
          aspect: "landscape",
        },
        {
          id: "project-04",
          title: "Metamorphosis",
          subtitle: "Visual poem for fashion",
          mediaUrl: "https://picsum.photos/seed/fashion-project-04/900/1200",
          mediaKind: "image",
          aspect: "portrait",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
      ],
    },
    {
      id: "fashion-reviews",
      type: "reviews",
      kicker: "Reviews",
      title: "What collaborators say",
      subtitle:
        "Selected notes from brand teams, stylists, and creative producers after campaign delivery.",
      items: [
        {
          id: "review-01",
          title: "Linh Tran",
          subtitle:
            "20sCreative gave the collection a precise visual language. The film felt editorial, but it still served the campaign clearly.",
          meta: "Creative Producer",
          mediaUrl: "",
          mediaKind: "image",
        },
        {
          id: "review-02",
          title: "Minh Atelier",
          subtitle:
            "The team understood fabric, movement, and pacing. We could use the same visual system across launch film, social cuts, and stills.",
          meta: "Fashion Brand",
          mediaUrl: "",
          mediaKind: "image",
        },
        {
          id: "review-03",
          title: "Trang Nguyen",
          subtitle:
            "Production was calm, focused, and fast. The final assets looked considered without losing the energy from set.",
          meta: "Stylist",
          mediaUrl: "",
          mediaKind: "image",
        },
      ],
    },
    {
      id: "cta-world",
      type: "cta",
      title: "The world of 20sCreative fashion",
      subtitle:
        "A living archive of moving images, still campaigns, and production fragments.",
      mediaUrl: "https://picsum.photos/seed/fashion-world/1600/900",
      mediaKind: "image",
      ctaLabel: "Contact for fashion work",
      ctaHref: "/contact",
    },
  ],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function isFashionPageContent(
  value: unknown,
): value is FashionPageContent {
  if (!isRecord(value)) return false;
  if (value.version !== 1) return false;
  if (typeof value.title !== "string") return false;
  if (typeof value.description !== "string") return false;
  if (!Array.isArray(value.blocks)) return false;

  return value.blocks.every((block) => {
    if (!isRecord(block)) return false;
    if (typeof block.id !== "string") return false;
    if (!fashionBlockTypes.includes(block.type as FashionBlockType)) return false;
    return typeof block.title === "string";
  });
}
