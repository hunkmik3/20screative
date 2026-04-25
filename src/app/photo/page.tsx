import type { Metadata } from "next";
import PhotoGrid from "@/components/PhotoGrid";
import { photoGridProjects } from "@/data/gallery";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Photo | 20sCreative",
    description:
        "Photography by 20sCreative. Professional photo campaigns, editorials, and visual art.",
};

export default function PhotoPage() {
    return (
        <div className={styles.page}>
            <PhotoGrid
                projects={photoGridProjects}
                pageTitle="Photo"
                pageSubtitle="Premiered by us"
            />
        </div>
    );
}
