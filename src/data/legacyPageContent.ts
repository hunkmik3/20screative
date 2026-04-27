import type {
  FeaturedSeries,
  NewestSeries,
  VideoProject,
} from "@/components/ProjectGrid";
import type { PhotoProject } from "@/components/PhotoGrid";
import type { SportProgram } from "@/components/SportGrid";
import {
  commercialFeaturedSeries,
  commercialLatestVideos,
  commercialNewestSeries,
  sportFeaturedSeries,
  sportOpeningSeries,
  photoGridProjects,
  sportPrograms,
} from "@/data/gallery";

export type LegacyPageSlug = "commercial" | "sport" | "photo";

export interface LegacyCommercialPageContent {
  version: 1;
  kind: "commercial";
  categoryTitle: string;
  categoryDescription: string;
  latestVideos: VideoProject[];
  newestSeries: NewestSeries;
  featuredSeries: FeaturedSeries;
}

export interface LegacySportPageContent {
  version: 1;
  kind: "sport";
  pageTitle: string;
  programs: SportProgram[];
  openingSeries: FeaturedSeries;
  featuredSeries: FeaturedSeries;
}

export interface LegacyPhotoPageContent {
  version: 1;
  kind: "photo";
  pageTitle: string;
  pageSubtitle: string;
  projects: PhotoProject[];
}

export interface LegacyPageContentMap {
  commercial: LegacyCommercialPageContent;
  sport: LegacySportPageContent;
  photo: LegacyPhotoPageContent;
}

export type LegacyPageContent = LegacyPageContentMap[LegacyPageSlug];

export const legacyPageSlugs: LegacyPageSlug[] = [
  "commercial",
  "sport",
  "photo",
];

const defaultLegacyPageContentBySlug: {
  [K in LegacyPageSlug]: LegacyPageContentMap[K];
} = {
  commercial: {
    version: 1,
    kind: "commercial",
    categoryTitle: "Commercial",
    categoryDescription:
      "Brand campaigns, advertising films, and corporate visual storytelling",
    latestVideos: commercialLatestVideos,
    newestSeries: commercialNewestSeries,
    featuredSeries: commercialFeaturedSeries,
  },
  sport: {
    version: 1,
    kind: "sport",
    pageTitle: "Special Programs",
    programs: sportPrograms.slice(0, 1),
    openingSeries: sportOpeningSeries,
    featuredSeries: sportFeaturedSeries,
  },
  photo: {
    version: 1,
    kind: "photo",
    pageTitle: "Photo",
    pageSubtitle: "Premiered by us",
    projects: photoGridProjects,
  },
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

function isVideoProject(value: unknown): value is VideoProject {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "thumbnail") &&
    hasString(value, "title") &&
    hasString(value, "description") &&
    hasString(value, "duration") &&
    hasString(value, "videoUrl")
  );
}

function isNewestSeries(value: unknown): value is NewestSeries {
  return (
    isRecord(value) &&
    hasString(value, "title") &&
    hasString(value, "description") &&
    hasString(value, "thumbnail") &&
    hasString(value, "videoUrl")
  );
}

function isFeaturedSeries(value: unknown): value is FeaturedSeries {
  return (
    isRecord(value) &&
    hasString(value, "title") &&
    typeof value.videoCount === "number" &&
    hasString(value, "description") &&
    Array.isArray(value.videos) &&
    value.videos.every(isVideoProject)
  );
}

function isSportProgram(value: unknown): value is SportProgram {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "thumbnail") &&
    hasString(value, "title") &&
    hasString(value, "subtitle") &&
    hasString(value, "videoUrl")
  );
}

function isPhotoProject(value: unknown): value is PhotoProject {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "thumbnail") &&
    hasString(value, "title") &&
    hasString(value, "description") &&
    hasString(value, "duration")
  );
}

function sportLookbookFromPrograms(
  programs: SportProgram[],
  fallback: FeaturedSeries,
): FeaturedSeries {
  const lookbookVideos = programs.slice(1).map<VideoProject>((program, index) => ({
    id: `sport-lookbook-${program.id || index + 1}`,
    thumbnail: program.thumbnail,
    title: program.title,
    description: program.subtitle,
    duration: "00:00",
    videoUrl: program.videoUrl,
    streamUid: program.streamUid,
    streamSourceUrl: program.streamSourceUrl,
    layout: program.layout,
  }));

  if (lookbookVideos.length === 0) {
    return clone(fallback);
  }

  return {
    ...clone(fallback),
    videoCount: lookbookVideos.length,
    videos: lookbookVideos,
  };
}

function normalizeFeaturedSeries(series: FeaturedSeries): FeaturedSeries {
  return {
    ...series,
    videoCount: series.videos.length,
  };
}

function normalizeSportPageContent(value: unknown): LegacySportPageContent | null {
  if (
    !isRecord(value) ||
    value.kind !== "sport" ||
    value.version !== 1 ||
    !hasString(value, "pageTitle") ||
    !Array.isArray(value.programs) ||
    !value.programs.every(isSportProgram)
  ) {
    return null;
  }

  const defaultContent = getDefaultLegacyPageContent("sport");
  const programs = value.programs as SportProgram[];
  const featuredSeries = isFeaturedSeries(value.featuredSeries)
    ? value.featuredSeries
    : sportLookbookFromPrograms(programs, defaultContent.featuredSeries);
  const openingSeries = isFeaturedSeries(value.openingSeries)
    ? value.openingSeries
    : featuredSeries;

  return {
    version: 1,
    kind: "sport",
    pageTitle: value.pageTitle as string,
    programs: programs.slice(0, 1),
    openingSeries: normalizeFeaturedSeries(openingSeries),
    featuredSeries: normalizeFeaturedSeries(featuredSeries),
  };
}

function normalizePhotoPageContent(value: unknown): LegacyPhotoPageContent | null {
  if (
    !isRecord(value) ||
    value.kind !== "photo" ||
    value.version !== 1 ||
    !hasString(value, "pageTitle") ||
    !hasString(value, "pageSubtitle") ||
    !Array.isArray(value.projects) ||
    !value.projects.every(isPhotoProject)
  ) {
    return null;
  }

  const defaultProjects = getDefaultLegacyPageContent("photo").projects;
  const currentProjects = value.projects as PhotoProject[];
  const projects = [...currentProjects.slice(0, 20)];

  while (projects.length < 20) {
    const fallback = defaultProjects[projects.length];
    if (!fallback) break;
    projects.push(clone(fallback));
  }

  return {
    version: 1,
    kind: "photo",
    pageTitle: value.pageTitle as string,
    pageSubtitle: value.pageSubtitle as string,
    projects,
  };
}

export function isLegacyPageSlug(value: string): value is LegacyPageSlug {
  return legacyPageSlugs.includes(value as LegacyPageSlug);
}

export function getDefaultLegacyPageContent<K extends LegacyPageSlug>(
  slug: K,
): LegacyPageContentMap[K] {
  return clone(defaultLegacyPageContentBySlug[slug]);
}

export function normalizeLegacyPageContent<K extends LegacyPageSlug>(
  slug: K,
  value: unknown,
): LegacyPageContentMap[K] | null {
  if (slug === "sport") {
    return normalizeSportPageContent(value) as LegacyPageContentMap[K] | null;
  }

  if (slug === "photo") {
    return normalizePhotoPageContent(value) as LegacyPageContentMap[K] | null;
  }

  if (isLegacyPageContent(slug, value)) {
    return clone(value) as LegacyPageContentMap[K];
  }

  return null;
}

export function isLegacyPageContent<K extends LegacyPageSlug>(
  slug: K,
  value: unknown,
): value is LegacyPageContentMap[K] {
  if (!isRecord(value) || value.kind !== slug || value.version !== 1) {
    return false;
  }

  if (slug === "commercial") {
    return (
      hasString(value, "categoryTitle") &&
      hasString(value, "categoryDescription") &&
      Array.isArray(value.latestVideos) &&
      value.latestVideos.every(isVideoProject) &&
      isNewestSeries(value.newestSeries) &&
      isFeaturedSeries(value.featuredSeries)
    );
  }

  if (slug === "sport") {
    return (
      hasString(value, "pageTitle") &&
      Array.isArray(value.programs) &&
      value.programs.every(isSportProgram) &&
      isFeaturedSeries(value.openingSeries) &&
      isFeaturedSeries(value.featuredSeries)
    );
  }

  return (
    hasString(value, "pageTitle") &&
    hasString(value, "pageSubtitle") &&
    Array.isArray(value.projects) &&
    value.projects.every(isPhotoProject)
  );
}
