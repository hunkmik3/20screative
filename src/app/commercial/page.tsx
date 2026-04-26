import type { Metadata } from "next";
import ProjectGrid from "@/components/ProjectGrid";
import { loadLegacyPageContent } from "@/lib/legacyPageContent";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Commercial | 20sCreative",
    description:
        "Commercial video production by 20sCreative. Brand campaigns, advertising, and corporate films.",
};

export default async function CommercialPage() {
    const content = await loadLegacyPageContent("commercial");

    return (
        <div className={styles.page}>
            <ProjectGrid
                categoryTitle={content.categoryTitle}
                categoryDescription={content.categoryDescription}
                latestVideos={content.latestVideos}
                newestSeries={content.newestSeries}
                featuredSeries={content.featuredSeries}
            />
        </div>
    );
}
