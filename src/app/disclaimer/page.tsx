import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Disclaimer | 20sCreative",
    description: "Disclaimer for 20sCreative website.",
};

export default function DisclaimerPage() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.title}>Disclaimer</h1>

                <div className={styles.content}>
                    <section className={styles.section}>
                        <h2>General Information</h2>
                        <p>
                            The information provided on this website is for general
                            informational purposes only. All information on the site is
                            provided in good faith, however, we make no representation or
                            warranty of any kind, express or implied, regarding the accuracy,
                            adequacy, validity, reliability, availability, or completeness of
                            any information on the site.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>External Links</h2>
                        <p>
                            This website may contain links to external websites that are not
                            provided or maintained by us. We do not guarantee the accuracy,
                            relevance, timeliness, or completeness of any information on these
                            external websites.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Copyright</h2>
                        <p>
                            All content on this website, including but not limited to
                            photographs, videos, text, and graphics, is the property of
                            20sCreative and is protected by copyright laws. Unauthorized use
                            or reproduction of any content is strictly prohibited.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>Contact Us</h2>
                        <p>
                            If you have any questions about this Disclaimer, please contact us
                            at hello@20screative.com.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
