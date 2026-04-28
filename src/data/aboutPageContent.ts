export interface AboutServiceLink {
  id: string;
  label: string;
  href: string;
}

export interface AboutPageContent {
  version: 1;
  title: string;
  description: string;
  introPrefix: string;
  introSuffix: string;
  serviceLinks: AboutServiceLink[];
  descriptionParagraphs: string[];
  capabilitiesTitle: string;
  capabilitiesBody: string;
  ctaLabel: string;
  ctaHref: string;
}

export const defaultAboutPageContent: AboutPageContent = {
  version: 1,
  title: "About | 20sCreative",
  description:
    "Learn about 20sCreative - a video production studio creating fashion, commercial, sport, and photography-led visual stories.",
  introPrefix:
    "We're 20sCreative, a video production studio crafting visual stories across",
  introSuffix: ".",
  serviceLinks: [
    { id: "fashion", label: "fashion", href: "/fashion" },
    { id: "commercial", label: "commercial", href: "/commercial" },
    { id: "sport", label: "sport", href: "/sport" },
    { id: "photo", label: "photo", href: "/photo" },
  ],
  descriptionParagraphs: [
    "We build films, campaigns, lookbooks, editorial systems, and still-image stories for brands that care about rhythm, detail, and atmosphere. Every project begins with a clear visual direction, then moves through production with a practical focus on what the final audience needs to feel.",
    "Our work sits between cinematic production and design-led image making. We handle creative development, pre-production, shooting, editing, color, sound, and delivery, keeping the process tight while leaving room for strong, unexpected moments on set.",
    "From fashion films and brand profiles to sport stories and photo editorials, our goal is simple: make the work feel intentional, contemporary, and useful beyond a single post.",
  ],
  capabilitiesTitle: "Capabilities",
  capabilitiesBody:
    "Creative direction, production, cinematography, photography, editing, color grading, motion assets, campaign cutdowns, and delivery for web, social, and live presentation.",
  ctaLabel: "Start a Project",
  ctaHref: "/contact",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function hasString(value: Record<string, unknown>, key: string) {
  return typeof value[key] === "string";
}

function isAboutServiceLink(value: unknown): value is AboutServiceLink {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "label") &&
    hasString(value, "href")
  );
}

export function normalizeAboutPageContent(
  value: unknown,
): AboutPageContent | null {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !hasString(value, "title") ||
    !hasString(value, "description") ||
    !hasString(value, "introPrefix") ||
    !hasString(value, "introSuffix") ||
    !Array.isArray(value.serviceLinks) ||
    !value.serviceLinks.every(isAboutServiceLink) ||
    !Array.isArray(value.descriptionParagraphs) ||
    !value.descriptionParagraphs.every((item) => typeof item === "string") ||
    !hasString(value, "capabilitiesTitle") ||
    !hasString(value, "capabilitiesBody") ||
    !hasString(value, "ctaLabel") ||
    !hasString(value, "ctaHref")
  ) {
    return null;
  }

  return {
    version: 1,
    title: value.title as string,
    description: value.description as string,
    introPrefix: value.introPrefix as string,
    introSuffix: value.introSuffix as string,
    serviceLinks: (value.serviceLinks as AboutServiceLink[]).map((item) => ({
      ...item,
    })),
    descriptionParagraphs: (value.descriptionParagraphs as string[]).slice(),
    capabilitiesTitle: value.capabilitiesTitle as string,
    capabilitiesBody: value.capabilitiesBody as string,
    ctaLabel: value.ctaLabel as string,
    ctaHref: value.ctaHref as string,
  };
}

export function isAboutPageContent(value: unknown): value is AboutPageContent {
  return Boolean(normalizeAboutPageContent(value));
}

export function getDefaultAboutPageContent() {
  return clone(defaultAboutPageContent);
}
