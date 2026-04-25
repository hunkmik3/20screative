import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Contact | 20sCreative",
    description:
        "Get in touch with 20sCreative for photography and film inquiries.",
};

export default function ContactPage() {
    return (
        <div className={styles.page}>
            <div className={styles.grid}>
                {/* Left: Business Info */}
                <aside className={styles.infoCol}>
                    <p className={styles.eyebrow}>Creative Agency</p>
                    <h1 className={styles.heading}>
                        Let&apos;s create
                        <br />
                        something together.
                    </h1>

                    <div className={styles.infoList}>
                        <div className={styles.infoBlock}>
                            <p className={styles.infoLabel}>Email</p>
                            <a
                                href="mailto:20screativee@gmail.com"
                                className={styles.infoValue}
                            >
                                20screativee@gmail.com
                            </a>
                        </div>

                        <div className={styles.infoBlock}>
                            <p className={styles.infoLabel}>Phone</p>
                            <a href="tel:0937005195" className={styles.infoValue}>
                                0937005195
                            </a>
                        </div>

                        <div className={styles.infoBlock}>
                            <p className={styles.infoLabel}>Location</p>
                            <p className={styles.infoValue}>Hồ Chí Minh, Việt Nam</p>
                        </div>
                    </div>
                </aside>

                {/* Right: Contact Form */}
                <section className={styles.formCol}>
                    <ContactForm />
                </section>
            </div>
        </div>
    );
}
