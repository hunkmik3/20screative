import Link from "next/link";
import type { AboutPageContent } from "@/data/aboutPageContent";
import styles from "./AboutPageView.module.css";

interface AboutPageViewProps {
  content: AboutPageContent;
}

export default function AboutPageView({ content }: AboutPageViewProps) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.intro}>
          <h1 className={styles.title}>
            {content.introPrefix.trim()}{" "}
            {content.serviceLinks.map((link, index) => (
              <span key={link.id}>
                <Link href={link.href} className={styles.link}>
                  {link.label}
                </Link>
                {index < content.serviceLinks.length - 2
                  ? ", "
                  : index === content.serviceLinks.length - 2
                    ? " and "
                    : ""}
              </span>
            ))}
            {content.introSuffix}
          </h1>
        </section>

        <section className={styles.description}>
          {content.descriptionParagraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
          ))}
        </section>

        <section className={styles.clients}>
          <h2 className={styles.sectionTitle}>{content.capabilitiesTitle}</h2>
          <p className={styles.clientList}>{content.capabilitiesBody}</p>
        </section>

        <section className={styles.cta}>
          <Link href={content.ctaHref} className={styles.ctaButton}>
            {content.ctaLabel}
          </Link>
        </section>
      </div>
    </div>
  );
}
