import type { Metadata } from "next";
import { siteConfig } from "@/data/gallery";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Contact | 20sCreative",
    description:
        "Get in touch with 20sCreative for photography and film inquiries.",
};

export default function ContactPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Main Contact */}
                <section className={styles.section}>
                    <h1 className={styles.title}>Photography & Film Inquiries</h1>
                    <div className={styles.contactInfo}>
                        <a href={`mailto:${siteConfig.email}`} className={styles.contactLink}>
                            {siteConfig.email}
                        </a>
                        <a href={`tel:${siteConfig.phone.replace(/\./g, "")}`} className={styles.contactLink}>
                            {siteConfig.phone}
                        </a>
                    </div>
                </section>

                {/* Representation */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Representation</h2>

                    <div className={styles.repBlock}>
                        <p className={styles.repLabel}>International Inquiries</p>
                        <a href={`tel:${siteConfig.phone.replace(/\./g, "")}`} className={styles.contactLink}>
                            {siteConfig.phone}
                        </a>
                        <a href={`mailto:${siteConfig.email}`} className={styles.contactLink}>
                            {siteConfig.email}
                        </a>
                    </div>
                </section>

                {/* Social Links */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Follow Us</h2>
                    <div className={styles.socialLinks}>
                        <a
                            href={siteConfig.social.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                        >
                            Instagram
                        </a>
                        <a
                            href={siteConfig.social.behance}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                        >
                            Behance
                        </a>
                        <a
                            href={siteConfig.social.vimeo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                        >
                            Vimeo
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
