import type { Metadata } from "next";
import SportGrid from "@/components/SportGrid";
import { sportPrograms } from "@/data/gallery";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Sport | 20sCreative",
    description:
        "Sport video production by 20sCreative. Athletic campaigns, action films, and sports storytelling.",
};

export default function SportPage() {
    return (
        <div className={styles.page}>
            <SportGrid
                programs={sportPrograms}
                pageTitle="Special Programs"
            />
        </div>
    );
}
