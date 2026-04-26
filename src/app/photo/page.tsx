import type { Metadata } from "next";
import PhotoGrid from "@/components/PhotoGrid";
import { loadLegacyPageContent } from "@/lib/legacyPageContent";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Photo | 20sCreative",
    description:
        "Photography by 20sCreative. Professional photo campaigns, editorials, and visual art.",
};

export default async function PhotoPage() {
    const content = await loadLegacyPageContent("photo");

    return (
        <div className={styles.page}>
            <PhotoGrid
                projects={content.projects}
                pageTitle={content.pageTitle}
                pageSubtitle={content.pageSubtitle}
            />
        </div>
    );
}
