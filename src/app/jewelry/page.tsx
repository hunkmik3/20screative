import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import { jewelryImages } from "@/data/gallery";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Jewelry Photography | 20sCreative",
    description:
        "Luxury jewelry photography and film by 20sCreative. High-end jewelry campaigns for luxury brands.",
};

export default function JewelryPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <Gallery images={jewelryImages} columns={3} />
            </div>
        </div>
    );
}
