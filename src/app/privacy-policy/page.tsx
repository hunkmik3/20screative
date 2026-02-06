import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Privacy Policy | 20sCreative",
    description: "Privacy Policy for 20sCreative website.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.title}>Privacy Policy</h1>

                <div className={styles.content}>
                    <section className={styles.section}>
                        <h2>Information We Collect</h2>
                        <p>
                            We collect information you provide directly to us, such as when you
                            contact us through our website, subscribe to our newsletter, or
                            communicate with us via email.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>How We Use Your Information</h2>
                        <p>
                            We use the information we collect to respond to your inquiries,
                            send you updates about our work, and improve our services.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Information Sharing</h2>
                        <p>
                            We do not sell, trade, or otherwise transfer your personal
                            information to outside parties without your consent, except as
                            required by law.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Cookies</h2>
                        <p>
                            Our website may use cookies to enhance your browsing experience.
                            You can choose to disable cookies through your browser settings.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact
                            us at hello@20screative.com.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
