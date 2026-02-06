import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Showreel | 20sCreative",
    description:
        "Fashion and beauty showreel by 20sCreative. Watch our latest work in motion.",
};

export default function ShowreelPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Fashion & Beauty Showreel */}
                <section className={styles.section}>
                    <h1 className={styles.title}>Fashion & Beauty Showreel</h1>
                    <div className={styles.videoWrapper}>
                        {/* Replace with your actual video embed or self-hosted video */}
                        <video
                            className={styles.video}
                            controls
                            poster="/images/showreel-fashion-poster.jpg"
                            preload="metadata"
                        >
                            <source src="/videos/showreel-fashion.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </section>

                {/* Beauty & Hair Showreel */}
                <section className={styles.section}>
                    <h2 className={styles.title}>Beauty & Hair Showreel</h2>
                    <div className={styles.videoWrapper}>
                        {/* Replace with your actual video embed or self-hosted video */}
                        <video
                            className={styles.video}
                            controls
                            poster="/images/showreel-beauty-poster.jpg"
                            preload="metadata"
                        >
                            <source src="/videos/showreel-beauty.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </section>
            </div>
        </div>
    );
}
