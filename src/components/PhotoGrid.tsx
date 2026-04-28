"use client";

import Image from "next/image";
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react";
import DragResizeFrame from "@/components/DragResizeFrame";
import type { FashionLayout } from "@/data/fashionPage";
import { resolveLayoutStyle } from "@/lib/fashionLayoutStyle";
import styles from "./PhotoGrid.module.css";

export interface PhotoMediaPosition {
    x: number;
    y: number;
}

export interface PhotoProject {
    id: string;
    thumbnail: string;
    title: string;
    description: string;
    duration: string;
    layout?: FashionLayout;
    mediaPosition?: PhotoMediaPosition;
}

interface PhotoGridProps {
    projects: PhotoProject[];
    pageTitle: string;
    pageSubtitle: string;
    editorMode?: boolean;
    selectedTarget?: string | null;
    onSelectTarget?: (target: string) => void;
    onUpdateLayout?: (target: string, next: FashionLayout) => void;
    onUpdateMediaPosition?: (target: string, next: PhotoMediaPosition) => void;
}

const hasAsset = (value?: string | null) => Boolean(value?.trim());
const DEFAULT_MEDIA_POSITION: PhotoMediaPosition = { x: 50, y: 50 };
const MEDIA_PAN_SCALE = 1.16;
const MEDIA_PAN_RANGE = 7.5;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const normalizeMediaPosition = (
    value?: Partial<PhotoMediaPosition>,
): PhotoMediaPosition => ({
    x: Number.isFinite(value?.x) ? clamp(Number(value?.x)) : DEFAULT_MEDIA_POSITION.x,
    y: Number.isFinite(value?.y) ? clamp(Number(value?.y)) : DEFAULT_MEDIA_POSITION.y,
});

const formatPosition = (position?: PhotoMediaPosition) => {
    const normalized = normalizeMediaPosition(position);
    return `${normalized.x}% ${normalized.y}%`;
};

export default function PhotoGrid({
    projects,
    pageTitle,
    pageSubtitle,
    editorMode = false,
    selectedTarget = null,
    onSelectTarget,
    onUpdateLayout,
    onUpdateMediaPosition,
}: PhotoGridProps) {
    const visibleProjects = projects.slice(0, 20);
    const dragRef = useRef<{
        target: string;
        startX: number;
        startY: number;
        startPosition: PhotoMediaPosition;
        width: number;
        height: number;
    } | null>(null);
    const [draggingTarget, setDraggingTarget] = useState<string | null>(null);

    const showDescription = (index: number) => {
        const pos = index % 6;
        return pos === 0 || pos === 2 || pos === 4;
    };

    const commitMediaPosition = (target: string, next: PhotoMediaPosition) => {
        onUpdateMediaPosition?.(target, {
            x: Math.round(clamp(next.x) * 10) / 10,
            y: Math.round(clamp(next.y) * 10) / 10,
        });
    };

    const handleMediaPointerMove = (event: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;

        const deltaX = ((event.clientX - drag.startX) / drag.width) * 100;
        const deltaY = ((event.clientY - drag.startY) / drag.height) * 100;

        commitMediaPosition(drag.target, {
            x: drag.startPosition.x + deltaX,
            y: drag.startPosition.y + deltaY,
        });
    };

    const stopMediaDrag = () => {
        dragRef.current = null;
        setDraggingTarget(null);
        document.removeEventListener("pointermove", handleMediaPointerMove);
        document.removeEventListener("pointerup", stopMediaDrag);
    };

    useEffect(() => {
        return () => {
            document.removeEventListener("pointermove", handleMediaPointerMove);
            document.removeEventListener("pointerup", stopMediaDrag);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startMediaDrag = (
        event: ReactPointerEvent<HTMLDivElement>,
        target: string,
        project: PhotoProject,
    ) => {
        if (!editorMode || !onUpdateMediaPosition || !hasAsset(project.thumbnail)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        onSelectTarget?.(target);

        const rect = event.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        dragRef.current = {
            target,
            startX: event.clientX,
            startY: event.clientY,
            startPosition: normalizeMediaPosition(project.mediaPosition),
            width: rect.width,
            height: rect.height,
        };
        setDraggingTarget(target);
        document.addEventListener("pointermove", handleMediaPointerMove);
        document.addEventListener("pointerup", stopMediaDrag);
    };

    const renderProjectCard = (project: PhotoProject, index: number) => {
        const target = `project:${index}`;
        const tileClass = styles[`tile${(index % 20) + 1}`] ?? "";
        const cardClass = [
            styles.card,
            tileClass,
            editorMode ? styles.cardEditor : "",
            selectedTarget === target ? styles.cardSelected : "",
        ]
            .filter(Boolean)
            .join(" ");
        const mediaPosition = normalizeMediaPosition(project.mediaPosition);
        const shouldPanImage =
            Boolean(project.mediaPosition) ||
            (editorMode && selectedTarget === target);
        const translateX = ((mediaPosition.x - 50) / 50) * MEDIA_PAN_RANGE;
        const translateY = ((mediaPosition.y - 50) / 50) * MEDIA_PAN_RANGE;
        const imageStyle: CSSProperties = {
            objectPosition: formatPosition(mediaPosition),
            ...(shouldPanImage
                ? {
                      transform: `translate3d(${translateX}%, ${translateY}%, 0) scale(${MEDIA_PAN_SCALE})`,
                  }
                : {}),
        };
        const children = (
            <>
                <div
                    className={`${styles.mediaViewport} ${
                        editorMode ? styles.mediaViewportEditor : ""
                    } ${draggingTarget === target ? styles.mediaViewportDragging : ""}`}
                    onPointerDown={(event) => startMediaDrag(event, target, project)}
                    onDoubleClick={(event) => {
                        if (!editorMode || !onUpdateMediaPosition) return;
                        event.preventDefault();
                        event.stopPropagation();
                        onSelectTarget?.(target);
                        commitMediaPosition(target, DEFAULT_MEDIA_POSITION);
                    }}
                >
                    {hasAsset(project.thumbnail) ? (
                        <Image
                            src={project.thumbnail}
                            alt={project.title}
                            width={800}
                            height={600}
                            className={styles.cardImage}
                            style={imageStyle}
                            loading={index < 5 ? "eager" : "lazy"}
                            draggable={false}
                        />
                    ) : (
                        <div className={styles.cardImagePlaceholder}>
                            No media
                        </div>
                    )}
                </div>
                {editorMode && selectedTarget === target && (
                    <span className={styles.layoutMoveHandle} aria-hidden="true" />
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
                    className={cardClass}
                >
                    {children}
                </DragResizeFrame>
            );
        }

        return (
            <article
                key={project.id}
                className={cardClass}
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
