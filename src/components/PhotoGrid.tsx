"use client";

import Image from "next/image";
import DragResizeFrame from "@/components/DragResizeFrame";
import type { FashionLayout } from "@/data/fashionPage";
import { resolveLayoutStyle } from "@/lib/fashionLayoutStyle";
import styles from "./PhotoGrid.module.css";

export interface PhotoProject {
    id: string;
    thumbnail: string;
    title: string;
    description: string;
    duration: string;
    layout?: FashionLayout;
}

interface PhotoGridProps {
    projects: PhotoProject[];
    pageTitle: string;
    pageSubtitle: string;
    editorMode?: boolean;
    selectedTarget?: string | null;
    onSelectTarget?: (target: string) => void;
    onUpdateLayout?: (target: string, next: FashionLayout) => void;
}

const hasAsset = (value?: string | null) => Boolean(value?.trim());

export default function PhotoGrid({
    projects,
    pageTitle,
    pageSubtitle,
    editorMode = false,
    selectedTarget = null,
    onSelectTarget,
    onUpdateLayout,
}: PhotoGridProps) {
    const visibleProjects = projects.slice(0, 20);

    const showDescription = (index: number) => {
        const pos = index % 6;
        return pos === 0 || pos === 2 || pos === 4;
    };

    const renderProjectCard = (project: PhotoProject, index: number) => {
        const target = `project:${index}`;
        const tileClass = styles[`tile${(index % 20) + 1}`] ?? "";
        const children = (
            <>
                {hasAsset(project.thumbnail) ? (
                    <Image
                        src={project.thumbnail}
                        alt={project.title}
                        width={800}
                        height={600}
                        className={styles.cardImage}
                        loading={index < 5 ? "eager" : "lazy"}
                    />
                ) : (
                    <div className={styles.cardImagePlaceholder}>
                        No media
                    </div>
                )}
                <div className={styles.cardOverlay}>
                    <h3 className={styles.cardTitle}>{project.title}</h3>
                    {showDescription(index) && project.description && (
                        <p className={styles.cardDesc}>{project.description}</p>
                    )}
                </div>
                {project.duration && (
                    <span className={styles.duration}>{project.duration}</span>
                )}
            </>
        );

        if (editorMode) {
            return (
                <DragResizeFrame
                    key={project.id}
                    enabled
                    selected={selectedTarget === target}
                    layout={project.layout}
                    onSelect={() => onSelectTarget?.(target)}
                    onChange={(next) => onUpdateLayout?.(target, next)}
                    ariaLabel={`Edit ${project.title}`}
                    className={`${styles.card} ${tileClass}`}
                >
                    {children}
                </DragResizeFrame>
            );
        }

        return (
            <article
                key={project.id}
                className={`${styles.card} ${tileClass}`}
                style={resolveLayoutStyle(project.layout)}
            >
                {children}
            </article>
        );
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>{pageTitle}</h1>
                <p className={styles.pageSubtitle}>{pageSubtitle}</p>
            </div>

            <div className={styles.grid}>
                {visibleProjects.map((project, index) =>
                    renderProjectCard(project, index),
                )}
            </div>
        </div>
    );
}
