import type { Metadata } from "next";
import { loadFashionPageContent } from "@/lib/fashionContent";
import FashionPageShell from "./FashionPageShell";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Fashion | 20sCreative",
    description:
        "Fashion video production by 20sCreative. High-end fashion campaigns and editorials.",
};

export default async function FashionPage() {
    const content = await loadFashionPageContent();

    const heroVideoUrl = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
    if (heroVideoUrl) {
        const heroIndex = content.blocks.findIndex(
            (block) => block.type === "hero",
        );
        if (heroIndex >= 0) {
            const hero = content.blocks[heroIndex];
            if (!hero.mediaUrl) {
                content.blocks[heroIndex] = {
                    ...hero,
                    mediaUrl: heroVideoUrl,
                    mediaKind: "video",
                };
            }
        }
    }

    return (
        <div className={styles.page}>
            <FashionPageShell content={content} />
        </div>
    );
}
