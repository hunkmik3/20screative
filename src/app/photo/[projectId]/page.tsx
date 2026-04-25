import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPhotoProjectById } from "@/data/gallery";
import styles from "./page.module.css";

interface PhotoProjectPageProps {
    params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
    params,
}: PhotoProjectPageProps): Promise<Metadata> {
    const { projectId } = await params;
    const project = getPhotoProjectById(projectId);

    if (!project) {
        return {
            title: "Project Not Found | 20sCreative",
        };
    }

    return {
        title: `${project.title} | 20sCreative`,
        description: project.subtitle,
    };
}

export default async function PhotoProjectPage({ params }: PhotoProjectPageProps) {
    const { projectId } = await params;
    const project = getPhotoProjectById(projectId);

    if (!project) notFound();

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <p className={styles.eyebrow}>20sCreative Photo Project</p>
                <h1 className={styles.title}>{project.title}</h1>
                <p className={styles.subtitle}>{project.subtitle}</p>
            </header>

            <section className={styles.gallery}>
                {project.images.map((image, index) => (
                    <figure key={image.id} className={styles.item}>
                        <Image
                            src={image.src}
                            alt={image.alt}
                            width={image.width}
                            height={image.height}
                            className={styles.image}
                            priority={index < 2}
                        />
                    </figure>
                ))}
            </section>
        </div>
    );
}
