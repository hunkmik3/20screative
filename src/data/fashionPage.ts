export type FashionMediaKind = "image" | "video";

export type FashionBlockType =
  | "hero"
  | "statement"
  | "textIntro"
  | "feature"
  | "lookFeature"
  | "mediaPair"
  | "editorialDuo"
  | "carousel"
  | "lookbook"
  | "lookbookLandscape"
  | "videoTeaser"
  | "projectGrid"
  | "worldGrid"
  | "reviews"
  | "spacer"
  | "cta";

export type FashionTheme = "light" | "dark" | "warm";
export type FashionAlign = "left" | "center" | "right";
export type FashionSpacerSize = "sm" | "md" | "lg" | "xl";
export type FashionCaptionPosition = "below" | "overlay";
export type FashionDuoColumn = "left" | "right";
export type FashionVerticalAlign = "top" | "center" | "bottom";

/**
 * Layout overrides applied via inline CSS. Each value is a raw CSS string
 * (e.g. "640px", "min(1080px, 90%)", "12vw"). Empty string = no override.
 */
export interface FashionLayout {
  maxWidth?: string;
  width?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingX?: string;
  marginTop?: string;
  marginBottom?: string;
  offsetX?: string;
  offsetY?: string;
  aspectRatio?: string;
  scale?: string;
  rotate?: string;
  zIndex?: string;
  textAlign?: "left" | "center" | "right";
}

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
  lookNumber?: string;
  captionPosition?: FashionCaptionPosition;
  column?: FashionDuoColumn;
  verticalAlign?: FashionVerticalAlign;
  showPlus?: boolean;
  layout?: FashionLayout;
  mediaLayout?: FashionLayout;
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
  theme?: FashionTheme;
  align?: FashionAlign;
  spacerSize?: FashionSpacerSize;
  fullBleed?: boolean;
  autoplay?: boolean;
  showPeek?: boolean;
  lookNumber?: string;
  layout?: FashionLayout;
  mediaLayout?: FashionLayout;
  textLayout?: FashionLayout;
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
  "textIntro",
  "feature",
  "lookFeature",
  "mediaPair",
  "editorialDuo",
  "carousel",
  "lookbook",
  "lookbookLandscape",
  "videoTeaser",
  "projectGrid",
  "worldGrid",
  "reviews",
  "spacer",
  "cta",
];

export const fashionThemes: FashionTheme[] = ["light", "dark", "warm"];
export const fashionAligns: FashionAlign[] = ["left", "center", "right"];
export const fashionSpacerSizes: FashionSpacerSize[] = ["sm", "md", "lg", "xl"];
export const fashionVerticalAligns: FashionVerticalAlign[] = [
  "top",
  "center",
  "bottom",
];

const placeholder = (seed: string, w = 900, h = 1200) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const defaultFashionPageContent: FashionPageContent = {
  version: 1,
  title: "Fashion | 20sCreative",
  description:
    "Fashion films, runway documentation, and editorial campaigns by 20sCreative — a video production studio based in Ho Chi Minh City and Hanoi.",
  blocks: [
    {
      id: "hero-fashion",
      type: "hero",
      kicker: "20sCreative — Fashion",
      title: "The Fashion Film Studio",
      subtitle: "Cinematic stories for the runway and beyond",
      mediaUrl: "",
      mediaKind: "video",
      posterUrl: placeholder("20s-fashion-hero", 1800, 1100),
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem showreel",
      theme: "dark",
    },
    {
      id: "intro-fashion",
      type: "textIntro",
      kicker: "Studio note",
      title: "Material, movement, and the space between image and film.",
      body:
        "20sCreative dựng hình ảnh thời trang như một hệ thống editorial: film mở màn, ảnh tĩnh chiến dịch, chân dung chi tiết và những đoạn phim ngắn — tất cả tồn tại cùng nhau trên một câu chuyện liền mạch. Cách tiếp cận của chúng tôi vừa cổ điển vừa đương đại, được thúc đẩy bởi sự thử nghiệm và niềm đam mê kể chuyện bằng hình ảnh.",
      ctaLabel: "Khám phá các dự án",
      ctaHref: "#fashion-spring-summer",
      align: "center",
      theme: "light",
    },
    {
      id: "duo-spring-summer",
      type: "editorialDuo",
      kicker: "Spring/Summer 2025",
      title: "Push looks",
      subtitle:
        "Hai chương ảnh xen kẽ — chuyển động trên sàn diễn và chi tiết hậu trường.",
      ctaLabel: "Khám phá bộ sưu tập",
      ctaHref: "#fashion-spring-summer",
      items: [
        {
          id: "duo-runway",
          title: "Spring/Summer 2025 — runway",
          mediaUrl: placeholder("ss25-runway", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          column: "left",
          verticalAlign: "top",
          showPlus: true,
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "duo-savoir",
          title: "Spring/Summer 2025 — savoir-faire",
          mediaUrl: placeholder("ss25-detail", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          column: "right",
          verticalAlign: "bottom",
          showPlus: true,
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
      ],
    },
    {
      id: "fashion-spring-summer",
      type: "lookFeature",
      kicker: "Look 01",
      title: "Spring/Summer Collection 2025",
      subtitle: "A cinematic study of texture, silhouette, and controlled motion.",
      mediaUrl: placeholder("ss25-feature", 1600, 2000),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem phim",
      lookNumber: "Look 01 — SS25",
      theme: "light",
      fullBleed: true,
    },
    {
      id: "lookbook-in-motion",
      type: "lookbook",
      kicker: "Series — In Motion",
      title: "Stories told through movement",
      subtitle:
        "Trích đoạn từ series 'In Motion' — những câu chuyện về thời trang qua chuyển động và biểu diễn phi truyền thống.",
      autoplay: true,
      showPeek: true,
      items: [
        {
          id: "in-motion-1",
          title: "In Motion — Chapter I",
          lookNumber: "Chapter I",
          mediaUrl: placeholder("inmotion-01", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "in-motion-2",
          title: "In Motion — Chapter II",
          lookNumber: "Chapter II",
          mediaUrl: placeholder("inmotion-02", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "in-motion-3",
          title: "In Motion — Chapter III",
          lookNumber: "Chapter III",
          mediaUrl: placeholder("inmotion-03", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "in-motion-4",
          title: "In Motion — Chapter IV",
          lookNumber: "Chapter IV",
          mediaUrl: placeholder("inmotion-04", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "in-motion-5",
          title: "In Motion — Chapter V",
          lookNumber: "Chapter V",
          mediaUrl: placeholder("inmotion-05", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
      ],
    },
    {
      id: "spacer-1",
      type: "spacer",
      title: "Spacer",
      spacerSize: "md",
    },
    {
      id: "fashion-behind-runway",
      type: "lookFeature",
      kicker: "Behind The Runway",
      title: "An intimate look backstage",
      subtitle:
        "Vietnam International Fashion Week — phía sau sàn diễn, nơi không khí chuẩn bị, vải vóc và ánh sáng kể câu chuyện riêng của chúng.",
      mediaUrl: placeholder("behind-runway", 1600, 2000),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem phim — 03:57",
      lookNumber: "Backstage",
      theme: "light",
      fullBleed: true,
    },
    {
      id: "lookbook-streetwear",
      type: "lookbook",
      kicker: "Urban Streetwear Editorial",
      title: "Street meets high fashion in Saigon",
      subtitle:
        "Editorial campaign giao thoa giữa văn hóa đường phố và high fashion, quay tại trung tâm TP.HCM.",
      autoplay: true,
      showPeek: true,
      items: [
        {
          id: "streetwear-1",
          title: "Saigon — Frame 01",
          lookNumber: "Frame 01",
          mediaUrl: placeholder("streetwear-01", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "streetwear-2",
          title: "Saigon — Frame 02",
          lookNumber: "Frame 02",
          mediaUrl: placeholder("streetwear-02", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "streetwear-3",
          title: "Saigon — Frame 03",
          lookNumber: "Frame 03",
          mediaUrl: placeholder("streetwear-03", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "streetwear-4",
          title: "Saigon — Frame 04",
          lookNumber: "Frame 04",
          mediaUrl: placeholder("streetwear-04", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
      ],
    },
    {
      id: "fashion-haute-couture",
      type: "lookFeature",
      kicker: "Haute Couture: The Making",
      title: "The meticulous craftsmanship behind a couture collection",
      subtitle:
        "Tài liệu hóa hành trình một bộ sưu tập couture — từ phác thảo đầu tiên đến đường kim cuối cùng.",
      mediaUrl: placeholder("haute-couture", 1600, 2000),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem phim — 05:02",
      lookNumber: "Couture · 05:02",
      theme: "light",
      fullBleed: true,
    },
    {
      id: "fashion-metamorphosis",
      type: "lookFeature",
      kicker: "Fashion Film",
      title: "Metamorphosis",
      subtitle:
        "Một bài thơ thị giác về sự biến đổi và bản dạng — kể qua thời trang.",
      mediaUrl: placeholder("metamorphosis", 1600, 2000),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem phim — 05:38",
      lookNumber: "Film · 05:38",
      theme: "light",
      fullBleed: true,
    },
    {
      id: "video-filmmakers",
      type: "videoTeaser",
      kicker: "Series — Fashion Filmmakers in Focus",
      title: "Turning the camera on the creative minds",
      subtitle:
        "Tám tập phim phỏng vấn các đạo diễn fashion film đương đại — về quy trình, ảnh hưởng và hướng đi của hình thức.",
      mediaUrl: placeholder("filmmakers-poster", 1600, 900),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem teaser",
      theme: "dark",
    },
    {
      id: "lookbook-landscape",
      type: "lookbookLandscape",
      kicker: "Series — Campaign cuts",
      title: "Frames in motion",
      subtitle:
        "Series ảnh ngang trích từ các chiến dịch — chuyển động, ánh sáng và bố cục editorial.",
      autoplay: true,
      showPeek: true,
      items: [
        {
          id: "land-1",
          title: "Frame 01",
          lookNumber: "Frame 01",
          mediaUrl: placeholder("frame-land-01", 1600, 900),
          mediaKind: "image",
          aspect: "landscape",
          captionPosition: "overlay",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "land-2",
          title: "Frame 02",
          lookNumber: "Frame 02",
          mediaUrl: placeholder("frame-land-02", 1600, 900),
          mediaKind: "image",
          aspect: "landscape",
          captionPosition: "overlay",
        },
        {
          id: "land-3",
          title: "Frame 03",
          lookNumber: "Frame 03",
          mediaUrl: placeholder("frame-land-03", 1600, 900),
          mediaKind: "image",
          aspect: "landscape",
          captionPosition: "overlay",
        },
        {
          id: "land-4",
          title: "Frame 04",
          lookNumber: "Frame 04",
          mediaUrl: placeholder("frame-land-04", 1600, 900),
          mediaKind: "image",
          aspect: "landscape",
          captionPosition: "overlay",
        },
        {
          id: "land-5",
          title: "Frame 05",
          lookNumber: "Frame 05",
          mediaUrl: placeholder("frame-land-05", 1600, 900),
          mediaKind: "image",
          aspect: "landscape",
          captionPosition: "overlay",
        },
      ],
    },
    {
      id: "world-grid",
      type: "worldGrid",
      kicker: "20sCreative universe",
      title: "Khám phá các thế giới khác",
      subtitle:
        "Studio làm việc xuyên suốt fashion, commercial, sport và photo — bốn ngôn ngữ thị giác cùng một cách kể chuyện.",
      items: [
        {
          id: "world-commercial",
          title: "Commercial",
          subtitle: "Brand campaigns and product films",
          mediaUrl: placeholder("world-commercial", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/commercial",
        },
        {
          id: "world-sport",
          title: "Sport",
          subtitle: "Athletes, energy, and motion",
          mediaUrl: placeholder("world-sport", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/sport",
        },
        {
          id: "world-photo",
          title: "Photo",
          subtitle: "Editorial and campaign stills",
          mediaUrl: placeholder("world-photo", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/photo",
        },
        {
          id: "world-about",
          title: "About the studio",
          subtitle: "Studio philosophy and clients",
          mediaUrl: placeholder("world-about", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/about",
        },
      ],
    },
    {
      id: "fashion-reviews",
      type: "reviews",
      kicker: "Notes from collaborators",
      title: "What brand teams say",
      subtitle:
        "Trích từ các stylist, creative producer và brand team đã đồng hành cùng 20sCreative trên các chiến dịch fashion.",
      items: [
        {
          id: "review-01",
          title: "Linh Tran",
          subtitle:
            "20sCreative cho bộ sưu tập một ngôn ngữ thị giác chính xác. Phim cảm giác editorial, nhưng vẫn phục vụ chiến dịch một cách rõ ràng.",
          meta: "Creative Producer",
          mediaUrl: "",
          mediaKind: "image",
        },
        {
          id: "review-02",
          title: "Minh Atelier",
          subtitle:
            "Đội ngũ hiểu chất liệu, chuyển động và nhịp điệu. Cùng một hệ thống thị giác chạy được trên launch film, social cuts và ảnh tĩnh.",
          meta: "Fashion brand",
          mediaUrl: "",
          mediaKind: "image",
        },
        {
          id: "review-03",
          title: "Trang Nguyen",
          subtitle:
            "Set quay yên tĩnh, tập trung và nhanh. Asset cuối cùng nhìn chỉn chu mà vẫn giữ được năng lượng từ hiện trường.",
          meta: "Stylist",
          mediaUrl: "",
          mediaKind: "image",
        },
      ],
    },
    {
      id: "cta-fashion",
      type: "cta",
      kicker: "Get in touch",
      title: "Cùng làm fashion film tiếp theo của bạn",
      subtitle:
        "20sCreative nhận dự án fashion tại Ho Chi Minh City, Hanoi và quốc tế — từ một look đơn lẻ đến một campaign trọn gói.",
      mediaUrl: placeholder("contact-fashion", 1600, 900),
      mediaKind: "image",
      ctaLabel: "Liên hệ studio",
      ctaHref: "/contact",
      theme: "dark",
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
