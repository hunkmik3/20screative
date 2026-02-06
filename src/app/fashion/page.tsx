import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import { fashionImages } from "@/data/gallery";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Fashion Photography | 20sCreative",
    description:
        "Fashion photography and film by 20sCreative. High-end fashion campaigns and editorials.",
};

export default function FashionPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <Gallery images={fashionImages} columns={3} />
            </div>
        </div>
    );
}
