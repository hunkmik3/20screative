import Link from "next/link";
import Image from "next/image";
import styles from "./PhotoGrid.module.css";

export interface PhotoProject {
    id: string;
    thumbnail: string;
    title: string;
    description: string;
    duration: string;
}

interface PhotoGridProps {
    projects: PhotoProject[];
    pageTitle: string;
    pageSubtitle: string;
}

export default function PhotoGrid({
    projects,
    pageTitle,
    pageSubtitle,
}: PhotoGridProps) {
    // Large cards show description (rows 1 & 3 in the 10-card cycle)
    const isLargeCard = (index: number) => {
        const pos = index % 10;
        return pos < 2 || (pos >= 5 && pos < 7);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>{pageTitle}</h1>
                <p className={styles.pageSubtitle}>{pageSubtitle}</p>
            </div>

            <div className={styles.grid}>
                {projects.map((project, index) => (
                    <Link
                        key={project.id}
                        href={`/photo/${project.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.card}
                    >
                        <Image
                            src={project.thumbnail}
                            alt={project.title}
                            width={800}
                            height={600}
                            className={styles.cardImage}
                            loading={index < 5 ? "eager" : "lazy"}
                        />
                        <div className={styles.cardOverlay}>
                            <h3 className={styles.cardTitle}>
                                {project.title}
                            </h3>
                            {isLargeCard(index) && project.description && (
                                <p className={styles.cardDesc}>
                                    {project.description}
                                </p>
                            )}
                        </div>
                        <span className={styles.duration}>
                            {project.duration}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
