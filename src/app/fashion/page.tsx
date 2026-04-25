import type { Metadata } from "next";
import FashionEditorialPage from "@/components/FashionEditorialPage";
import { loadFashionPageContent } from "@/lib/fashionContent";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Fashion | 20sCreative",
    description:
        "Fashion video production by 20sCreative. High-end fashion campaigns and editorials.",
};

export default async function FashionPage() {
    const content = await loadFashionPageContent();

    return (
        <div className={styles.page}>
            <FashionEditorialPage content={content} />
        </div>
    );
}
