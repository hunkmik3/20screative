import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/data/gallery";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "About | 20sCreative",
    description:
        "Learn about 20sCreative - Creative photographer and filmmaker specializing in fashion, beauty, and jewelry campaigns.",
};

export default function AboutPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Main Introduction */}
                <section className={styles.intro}>
                    <h1 className={styles.title}>
                        We&apos;re 20sCreative, a creative photographer & filmmaker,
                        specializing in{" "}
                        <Link href="/beauty" className={styles.link}>
                            beauty
                        </Link>{" "}
                        &{" "}
                        <Link href="/jewelry" className={styles.link}>
                            jewelry
                        </Link>
                    </h1>
                </section>

                {/* Description */}
                <section className={styles.description}>
                    <p>
                        Our creative approach is driven by experimentation, crafting visually
                        striking and unique aesthetics that blend classic and contemporary
                        photography. We consistently aim to captivate and surprise our
                        audience.
                    </p>
                    <p>
                        We started our journey in creative photography and filmmaking with a
                        passion for visual storytelling. Over the years, we&apos;ve had the
                        privilege of working with incredible brands and talented individuals
                        who share our vision for excellence.
                    </p>
                    <p>
                        Our seamless transition between photography and directing ensures a
                        cohesive, cinematic approach across all our endeavors. We&apos;re
                        truly fueled by our deep passion for what we do, and that comes
                        through in every project.
                    </p>
                </section>

                {/* Clients */}
                <section className={styles.clients}>
                    <h2 className={styles.sectionTitle}>Clients</h2>
                    <p className={styles.clientList}>
                        {siteConfig.clients.map((client, index) => (
                            <span key={client}>
                                {client}
                                {index < siteConfig.clients.length - 1 && ", "}
                            </span>
                        ))}
                        {" and more…"}
                    </p>
                </section>

                {/* CTA */}
                <section className={styles.cta}>
                    <Link href="/contact" className={styles.ctaButton}>
                        Get in Touch
                    </Link>
                </section>
            </div>
        </div>
    );
}
