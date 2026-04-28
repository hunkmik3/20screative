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
    const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
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

    const activePhoto =
        activePhotoIndex !== null ? visibleProjects[activePhotoIndex] : null;
    const canNavigatePopup = visibleProjects.length > 1;
    const closePopup = () => setActivePhotoIndex(null);
    const showPrevPhoto = () => {
        setActivePhotoIndex((current) => {
            if (current === null) return current;
            return (current - 1 + visibleProjects.length) % visibleProjects.length;
        });
    };
    const showNextPhoto = () => {
        setActivePhotoIndex((current) => {
            if (current === null) return current;
            return (current + 1) % visibleProjects.length;
        });
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

    useEffect(() => {
        if (!activePhoto) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closePopup();
            } else if (event.key === "ArrowLeft") {
                showPrevPhoto();
            } else if (event.key === "ArrowRight") {
                showNextPhoto();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePhoto]);

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
            <button
                type="button"
                key={project.id}
                className={`${cardClass} ${styles.cardButton}`}
                style={resolveLayoutStyle(project.layout)}
                onClick={() => {
                    if (!hasAsset(project.thumbnail)) return;
                    setActivePhotoIndex(index);
                }}
                aria-label={`Open ${project.title}`}
            >
                {children}
            </button>
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

            {activePhoto && hasAsset(activePhoto.thumbnail) && (
                <div
                    className={styles.popup}
                    role="dialog"
                    aria-modal="true"
                    aria-label={activePhoto.title}
                    onClick={closePopup}
                >
                    <button
                        type="button"
                        className={styles.popupClose}
                        onClick={closePopup}
                        aria-label="Close image"
                    >
                        ×
                    </button>
                    {canNavigatePopup && (
                        <button
                            type="button"
                            className={`${styles.popupArrow} ${styles.popupArrowPrev}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                showPrevPhoto();
                            }}
                            aria-label="Previous image"
                        >
                            ‹
                        </button>
                    )}
                    <figure
                        className={styles.popupFigure}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <Image
                            src={activePhoto.thumbnail}
                            alt={activePhoto.title}
                            width={1800}
                            height={1200}
                            className={styles.popupImage}
                            priority
                        />
                        {(activePhoto.title || activePhoto.description) && (
                            <figcaption className={styles.popupCaption}>
                                {activePhoto.duration && (
                                    <span>{activePhoto.duration}</span>
                                )}
                                {activePhoto.title && <strong>{activePhoto.title}</strong>}
                                {activePhoto.description && (
                                    <p>{activePhoto.description}</p>
                                )}
                            </figcaption>
                        )}
                    </figure>
                    {canNavigatePopup && (
                        <button
                            type="button"
                            className={`${styles.popupArrow} ${styles.popupArrowNext}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                showNextPhoto();
                            }}
                            aria-label="Next image"
                        >
                            ›
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
