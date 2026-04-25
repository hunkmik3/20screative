import type { Metadata } from "next";
import ProjectGrid from "@/components/ProjectGrid";
import {
    commercialLatestVideos,
    commercialNewestSeries,
    commercialFeaturedSeries,
} from "@/data/gallery";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Commercial | 20sCreative",
    description:
        "Commercial video production by 20sCreative. Brand campaigns, advertising, and corporate films.",
};

export default function CommercialPage() {
    return (
        <div className={styles.page}>
            <ProjectGrid
                categoryTitle="Commercial"
                categoryDescription="Brand campaigns, advertising films, and corporate visual storytelling"
                latestVideos={commercialLatestVideos}
                newestSeries={commercialNewestSeries}
                featuredSeries={commercialFeaturedSeries}
            />
        </div>
    );
}
