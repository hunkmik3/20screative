import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "About | 20sCreative",
    description:
        "Learn about 20sCreative - a video production studio creating fashion, commercial, sport, and photography-led visual stories.",
};

export default function AboutPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Main Introduction */}
                <section className={styles.intro}>
                    <h1 className={styles.title}>
                        We&apos;re 20sCreative, a video production studio crafting
                        visual stories across{" "}
                        <Link href="/fashion" className={styles.link}>
                            fashion
                        </Link>{" "}
                        ,{" "}
                        <Link href="/commercial" className={styles.link}>
                            commercial
                        </Link>
                        ,{" "}
                        <Link href="/sport" className={styles.link}>
                            sport
                        </Link>{" "}
                        and{" "}
                        <Link href="/photo" className={styles.link}>
                            photo
                        </Link>
                        .
                    </h1>
                </section>

                {/* Description */}
                <section className={styles.description}>
                    <p>
                        We build films, campaigns, lookbooks, editorial systems, and
                        still-image stories for brands that care about rhythm, detail, and
                        atmosphere. Every project begins with a clear visual direction, then
                        moves through production with a practical focus on what the final
                        audience needs to feel.
                    </p>
                    <p>
                        Our work sits between cinematic production and design-led image
                        making. We handle creative development, pre-production, shooting,
                        editing, color, sound, and delivery, keeping the process tight while
                        leaving room for strong, unexpected moments on set.
                    </p>
                    <p>
                        From fashion films and brand profiles to sport stories and photo
                        editorials, our goal is simple: make the work feel intentional,
                        contemporary, and useful beyond a single post.
                    </p>
                </section>

                {/* Capabilities */}
                <section className={styles.clients}>
                    <h2 className={styles.sectionTitle}>Capabilities</h2>
                    <p className={styles.clientList}>
                        Creative direction, production, cinematography, photography,
                        editing, color grading, motion assets, campaign cutdowns, and
                        delivery for web, social, and live presentation.
                    </p>
                </section>

                {/* CTA */}
                <section className={styles.cta}>
                    <Link href="/contact" className={styles.ctaButton}>
                        Start a Project
                    </Link>
                </section>
            </div>
        </div>
    );
}
