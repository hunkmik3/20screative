import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import { beautyImages } from "@/data/gallery";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Beauty Photography | 20sCreative",
    description:
        "Beauty photography and film by 20sCreative. High-end beauty and makeup campaigns.",
};

export default function BeautyPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <Gallery images={beautyImages} columns={3} />
            </div>
        </div>
    );
}
