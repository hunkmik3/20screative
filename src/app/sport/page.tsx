import type { Metadata } from "next";
import SportGrid from "@/components/SportGrid";
import { loadLegacyPageContent } from "@/lib/legacyPageContent";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Sport | 20sCreative",
    description:
        "Sport video production by 20sCreative. Athletic campaigns, action films, and sports storytelling.",
};

export default async function SportPage() {
    const content = await loadLegacyPageContent("sport");

    return (
        <div className={styles.page}>
            <SportGrid
                programs={content.programs}
                openingSeries={content.openingSeries}
                featuredSeries={content.featuredSeries}
                pageTitle={content.pageTitle}
            />
        </div>
    );
}
