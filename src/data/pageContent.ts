import {
  defaultFashionPageContent,
  type FashionPageContent,
} from "@/data/fashionPage";

export type EditablePageSlug =
  | "fashion"
  | "commercial"
  | "sport"
  | "photo"
  | "about";

export const editablePages: {
  slug: EditablePageSlug;
  label: string;
  href: string;
}[] = [
  { slug: "fashion", label: "Fashion", href: "/fashion" },
  { slug: "commercial", label: "Commercial", href: "/commercial" },
  { slug: "sport", label: "Sport", href: "/sport" },
  { slug: "photo", label: "Photo", href: "/photo" },
  { slug: "about", label: "About", href: "/about" },
];

const placeholder = (seed: string, w = 1200, h = 900) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const commercialDefault: FashionPageContent = {
  version: 1,
  title: "Commercial | 20sCreative",
  description:
    "Commercial video production by 20sCreative: brand campaigns, product launches, corporate films, food, automotive, and real estate.",
  blocks: [
    {
      id: "commercial-hero",
      type: "hero",
      kicker: "20sCreative — Commercial",
      title: "Brand films built for attention",
      subtitle: "Campaigns, launch films, and product stories",
      mediaUrl: placeholder("20s-commercial-hero", 1800, 1100),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem showreel",
      theme: "dark",
    },
    {
      id: "commercial-intro",
      type: "textIntro",
      kicker: "Commercial studio",
      title: "A clear idea, precise visual language, and assets that travel.",
      body:
        "Commercial work at 20sCreative is built as a campaign system: a hero film, short edits, product frames, stills, and social cutdowns that feel consistent across every format.",
      ctaLabel: "Xem các dự án",
      ctaHref: "#commercial-projects",
      align: "center",
      theme: "light",
    },
    {
      id: "commercial-projects",
      type: "projectGrid",
      kicker: "Projects",
      title: "Selected commercial work",
      subtitle: "Brand stories, product films, food, real estate, and automotive.",
      items: [
        {
          id: "commercial-brand-film",
          title: "Luxury Lifestyle",
          subtitle: "A high-end brand film for modern living.",
          mediaUrl: placeholder("commercial-brand-film", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "commercial-product-launch",
          title: "Tech Innovation",
          subtitle: "Dynamic product reveal for a technology launch.",
          mediaUrl: placeholder("commercial-product-launch", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "commercial-food",
          title: "Taste & Art",
          subtitle: "Cinematic food storytelling for restaurant campaigns.",
          mediaUrl: placeholder("commercial-food", 1200, 900),
          mediaKind: "image",
          aspect: "landscape",
        },
        {
          id: "commercial-automotive",
          title: "Drive & Design",
          subtitle: "Speed, engineering, and form captured on film.",
          mediaUrl: placeholder("commercial-automotive", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
      ],
    },
    {
      id: "commercial-video-teaser",
      type: "videoTeaser",
      kicker: "Brand Stories",
      title: "Narratives that connect brands with their audience",
      subtitle:
        "A teaser format for campaigns that need a focused hero film and a strong visual hook.",
      mediaUrl: placeholder("commercial-video-teaser", 1600, 900),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem teaser",
      theme: "dark",
    },
    {
      id: "commercial-world-grid",
      type: "worldGrid",
      kicker: "Explore more",
      title: "Production across formats",
      subtitle: "Commercial work connects naturally with fashion, sport, and photo.",
      items: [
        {
          id: "commercial-world-fashion",
          title: "Fashion",
          subtitle: "Runway films and editorial campaigns",
          mediaUrl: placeholder("commercial-world-fashion", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/fashion",
        },
        {
          id: "commercial-world-sport",
          title: "Sport",
          subtitle: "Motion-led athlete storytelling",
          mediaUrl: placeholder("commercial-world-sport", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/sport",
        },
        {
          id: "commercial-world-photo",
          title: "Photo",
          subtitle: "Campaign stills and editorial sets",
          mediaUrl: placeholder("commercial-world-photo", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/photo",
        },
      ],
    },
    {
      id: "commercial-reviews",
      type: "reviews",
      kicker: "Client notes",
      title: "What brand teams say",
      items: [
        {
          id: "commercial-review-1",
          title: "Brand Manager",
          subtitle:
            "The final assets felt premium but practical. We could use them across launch film, paid media, and social edits.",
          meta: "Lifestyle brand",
          mediaUrl: "",
          mediaKind: "image",
        },
        {
          id: "commercial-review-2",
          title: "Marketing Lead",
          subtitle:
            "20sCreative translated a complex product idea into a clear campaign film without losing visual polish.",
          meta: "Technology launch",
          mediaUrl: "",
          mediaKind: "image",
        },
      ],
    },
    {
      id: "commercial-cta",
      type: "cta",
      kicker: "Commercial inquiries",
      title: "Build the next campaign film with us",
      subtitle:
        "From product launch to full brand campaign, 20sCreative can shape the visual system from concept to final delivery.",
      mediaUrl: placeholder("commercial-cta", 1600, 900),
      mediaKind: "image",
      ctaLabel: "Liên hệ studio",
      ctaHref: "/contact",
      theme: "dark",
    },
  ],
};

const sportDefault: FashionPageContent = {
  version: 1,
  title: "Sport | 20sCreative",
  description:
    "Sport video production by 20sCreative: athletic campaigns, action films, and sports storytelling.",
  blocks: [
    {
      id: "sport-hero",
      type: "hero",
      kicker: "20sCreative — Sport",
      title: "Motion, discipline, and performance",
      subtitle: "Athlete stories with cinematic energy",
      mediaUrl: placeholder("20s-sport-hero", 1800, 1100),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem chương trình",
      theme: "dark",
    },
    {
      id: "sport-intro",
      type: "textIntro",
      kicker: "Special programs",
      title: "Sport films need rhythm, proximity, and a real sense of effort.",
      body:
        "We build sport campaigns around movement: training details, physical texture, match-day tension, and the emotional arc behind performance.",
      ctaLabel: "Khám phá programs",
      ctaHref: "#sport-programs",
      align: "center",
    },
    {
      id: "sport-programs",
      type: "projectGrid",
      kicker: "Programs",
      title: "Special programs",
      subtitle: "Athlete-led films and campaign series.",
      items: [
        {
          id: "sport-beyond-limits",
          title: "#BeyondLimits",
          subtitle: "Elite athletes pushing past physical and mental barriers.",
          mediaUrl: placeholder("sport-beyond-limits", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "sport-riding-waves",
          title: "#RidingWaves",
          subtitle: "Surf culture and ocean life in Vietnam.",
          mediaUrl: placeholder("sport-riding-waves", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
        },
        {
          id: "sport-fighters",
          title: "#TheFightersJourney",
          subtitle: "Dedication inside the boxing ring.",
          mediaUrl: placeholder("sport-fighters", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
        },
        {
          id: "sport-road-soul",
          title: "#RoadAndSoul",
          subtitle: "Endurance, landscape, and long-distance cycling.",
          mediaUrl: placeholder("sport-road-soul", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
        },
      ],
    },
    {
      id: "sport-lookbook",
      type: "lookbook",
      kicker: "Training frames",
      title: "Energy in motion",
      subtitle: "Short chapters for training, campaign, and social storytelling.",
      showPeek: true,
      items: [
        {
          id: "sport-frame-1",
          title: "Frame 01",
          lookNumber: "Frame 01",
          mediaUrl: placeholder("sport-frame-1", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "sport-frame-2",
          title: "Frame 02",
          lookNumber: "Frame 02",
          mediaUrl: placeholder("sport-frame-2", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "sport-frame-3",
          title: "Frame 03",
          lookNumber: "Frame 03",
          mediaUrl: placeholder("sport-frame-3", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
      ],
    },
    {
      id: "sport-video-teaser",
      type: "videoTeaser",
      kicker: "Campaign cut",
      title: "High-energy films for premium fitness and sportswear brands",
      mediaUrl: placeholder("sport-video-teaser", 1600, 900),
      mediaKind: "image",
      videoUrl: "https://www.youtube.com/watch?v=ZydWWTTWuO8",
      ctaLabel: "Xem teaser",
      theme: "dark",
    },
    {
      id: "sport-reviews",
      type: "reviews",
      kicker: "Field notes",
      title: "What teams say",
      items: [
        {
          id: "sport-review-1",
          title: "Campaign Producer",
          subtitle:
            "The team captured speed and emotion without staging away the reality of training.",
          meta: "Sportswear campaign",
          mediaUrl: "",
          mediaKind: "image",
        },
        {
          id: "sport-review-2",
          title: "Fitness Founder",
          subtitle:
            "The edit was intense, precise, and useful across every launch channel.",
          meta: "Fitness brand",
          mediaUrl: "",
          mediaKind: "image",
        },
      ],
    },
    {
      id: "sport-cta",
      type: "cta",
      kicker: "Sport production",
      title: "Tell the story behind performance",
      mediaUrl: placeholder("sport-cta", 1600, 900),
      mediaKind: "image",
      ctaLabel: "Liên hệ studio",
      ctaHref: "/contact",
      theme: "dark",
    },
  ],
};

const photoDefault: FashionPageContent = {
  version: 1,
  title: "Photo | 20sCreative",
  description:
    "Photography by 20sCreative: professional photo campaigns, editorials, portraits, and visual art.",
  blocks: [
    {
      id: "photo-hero",
      type: "hero",
      kicker: "20sCreative — Photo",
      title: "Still images with cinematic intent",
      subtitle: "Portraits, campaigns, editorials, and visual stories",
      mediaUrl: placeholder("20s-photo-hero", 1800, 1100),
      mediaKind: "image",
      ctaLabel: "Xem dự án",
      ctaHref: "#photo-projects",
      theme: "dark",
    },
    {
      id: "photo-intro",
      type: "textIntro",
      kicker: "Photo archive",
      title: "Photography that can stand alone or extend a moving-image campaign.",
      body:
        "From portrait series to campaign stills, our photo work is designed as a complete visual system: hero images, close details, editorial sequences, and social-ready crops.",
      align: "center",
    },
    {
      id: "photo-projects",
      type: "projectGrid",
      kicker: "Projects",
      title: "Premiered by us",
      subtitle: "Selected photography projects and editorial series.",
      items: [
        {
          id: "photo-faces-saigon",
          title: "Faces of Saigon",
          subtitle: "Intimate portraits from Ho Chi Minh City.",
          mediaUrl: placeholder("photo-faces-saigon", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/photo/pg-1",
        },
        {
          id: "photo-studio",
          title: "Light & Shadow",
          subtitle: "Controlled studio lighting and form.",
          mediaUrl: placeholder("photo-studio", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/photo/pg-2",
        },
        {
          id: "photo-urban",
          title: "Urban Stories",
          subtitle: "Candid street photography from Vietnam.",
          mediaUrl: placeholder("photo-urban", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          href: "/photo/pg-3",
        },
        {
          id: "photo-architecture",
          title: "Architecture",
          subtitle: "Geometric beauty and spatial design.",
          mediaUrl: placeholder("photo-architecture", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          href: "/photo/pg-4",
        },
      ],
    },
    {
      id: "photo-lookbook",
      type: "lookbook",
      kicker: "Selected frames",
      title: "A visual sequence",
      showPeek: true,
      items: [
        {
          id: "photo-frame-1",
          title: "Frame 01",
          lookNumber: "Frame 01",
          mediaUrl: placeholder("photo-frame-1", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "photo-frame-2",
          title: "Frame 02",
          lookNumber: "Frame 02",
          mediaUrl: placeholder("photo-frame-2", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
        {
          id: "photo-frame-3",
          title: "Frame 03",
          lookNumber: "Frame 03",
          mediaUrl: placeholder("photo-frame-3", 900, 1200),
          mediaKind: "image",
          aspect: "portrait",
          captionPosition: "overlay",
        },
      ],
    },
    {
      id: "photo-reviews",
      type: "reviews",
      kicker: "Client notes",
      title: "What collaborators say",
      items: [
        {
          id: "photo-review-1",
          title: "Art Director",
          subtitle:
            "The stills carried the same cinematic quality as the film, but each frame also worked by itself.",
          meta: "Editorial campaign",
          mediaUrl: "",
          mediaKind: "image",
        },
        {
          id: "photo-review-2",
          title: "Producer",
          subtitle:
            "Strong direction on set, clear delivery, and a flexible image set for every channel.",
          meta: "Brand shoot",
          mediaUrl: "",
          mediaKind: "image",
        },
      ],
    },
    {
      id: "photo-cta",
      type: "cta",
      kicker: "Photo inquiries",
      title: "Build the image system for your next campaign",
      mediaUrl: placeholder("photo-cta", 1600, 900),
      mediaKind: "image",
      ctaLabel: "Liên hệ studio",
      ctaHref: "/contact",
      theme: "dark",
    },
  ],
};

const aboutDefault: FashionPageContent = {
  version: 1,
  title: "About | 20sCreative",
  description:
    "Learn about 20sCreative: a creative studio specializing in film, photography, fashion, commercial, sport, and photo campaigns.",
  blocks: [
    {
      id: "about-hero",
      type: "hero",
      kicker: "About 20sCreative",
      title: "A creative studio for moving image and photography",
      subtitle: "Based in Ho Chi Minh City, Hanoi, and working internationally",
      mediaUrl: placeholder("20s-about-hero", 1800, 1100),
      mediaKind: "image",
      ctaLabel: "Liên hệ studio",
      ctaHref: "/contact",
      theme: "dark",
    },
    {
      id: "about-intro",
      type: "textIntro",
      kicker: "Studio philosophy",
      title: "Experimentation, precision, and visual storytelling.",
      body:
        "Our approach blends classic and contemporary image-making. We move between directing, photography, editing, and campaign thinking so every project can feel cohesive from hero film to final still.",
      align: "center",
    },
    {
      id: "about-world",
      type: "worldGrid",
      kicker: "Work areas",
      title: "Four ways we build visual systems",
      items: [
        {
          id: "about-fashion",
          title: "Fashion",
          subtitle: "Runway films and editorials",
          mediaUrl: placeholder("about-fashion", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/fashion",
        },
        {
          id: "about-commercial",
          title: "Commercial",
          subtitle: "Brand campaigns and product films",
          mediaUrl: placeholder("about-commercial", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/commercial",
        },
        {
          id: "about-sport",
          title: "Sport",
          subtitle: "Athlete-led storytelling",
          mediaUrl: placeholder("about-sport", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/sport",
        },
        {
          id: "about-photo",
          title: "Photo",
          subtitle: "Campaign stills and portraits",
          mediaUrl: placeholder("about-photo", 1200, 800),
          mediaKind: "image",
          aspect: "landscape",
          href: "/photo",
        },
      ],
    },
    {
      id: "about-reviews",
      type: "reviews",
      kicker: "Collaborators",
      title: "Clients and collaborators",
      items: [
        {
          id: "about-client-1",
          title: "Client 1",
          subtitle:
            "A compact studio with strong direction and a sharp sense of visual consistency.",
          meta: "Brand collaborator",
          mediaUrl: "",
          mediaKind: "image",
        },
        {
          id: "about-client-2",
          title: "Client 2",
          subtitle:
            "The team understood both the creative ambition and the practical delivery needs.",
          meta: "Creative producer",
          mediaUrl: "",
          mediaKind: "image",
        },
      ],
    },
    {
      id: "about-cta",
      type: "cta",
      kicker: "Start a project",
      title: "Let’s create something together",
      mediaUrl: placeholder("about-cta", 1600, 900),
      mediaKind: "image",
      ctaLabel: "Get in touch",
      ctaHref: "/contact",
      theme: "dark",
    },
  ],
};

export const defaultPageContentBySlug: Record<
  EditablePageSlug,
  FashionPageContent
> = {
  fashion: defaultFashionPageContent,
  commercial: commercialDefault,
  sport: sportDefault,
  photo: photoDefault,
  about: aboutDefault,
};

export function isEditablePageSlug(value: string): value is EditablePageSlug {
  return editablePages.some((page) => page.slug === value);
}

export function getDefaultPageContent(
  slug: EditablePageSlug,
): FashionPageContent {
  return defaultPageContentBySlug[slug];
}
