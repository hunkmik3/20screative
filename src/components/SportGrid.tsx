"use client";

import { useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import DragResizeFrame from "@/components/DragResizeFrame";
import type { FashionLayout } from "@/data/fashionPage";
import { resolveLayoutStyle } from "@/lib/fashionLayoutStyle";
import type { FeaturedSeries, VideoProject } from "./ProjectGrid";
import styles from "./SportGrid.module.css";
import VideoLookbook from "./VideoLookbook";
import VideoPopup from "./VideoPopup";

export interface SportProgram {
    id: string;
    thumbnail: string;
    title: string;
    subtitle: string;
    videoUrl: string;
    layout?: FashionLayout;
}

interface SportGridProps {
    programs: SportProgram[];
    openingSeries: FeaturedSeries;
    featuredSeries: FeaturedSeries;
    pageTitle: string;
    editorMode?: boolean;
    selectedTarget?: string | null;
    onSelectTarget?: (target: string) => void;
    onUpdateLayout?: (target: string, next: FashionLayout) => void;
}

const hasAsset = (value?: string | null) => Boolean(value?.trim());
type PlayableVideo = Pick<VideoProject, "title" | "videoUrl">;

export default function SportGrid({
    programs,
    openingSeries,
    featuredSeries,
    pageTitle,
    editorMode = false,
    selectedTarget = null,
    onSelectTarget,
    onUpdateLayout,
}: SportGridProps) {
    const [activeVideo, setActiveVideo] = useState<PlayableVideo | null>(null);

    const openVideo = useCallback((video: PlayableVideo) => {
        if (!hasAsset(video.videoUrl)) return;
        setActiveVideo(video);
    }, []);

    const closeVideo = useCallback(() => {
        setActiveVideo(null);
    }, []);

    const renderEditableCard = (
        program: SportProgram,
        children: ReactNode,
    ) => {
        const target = "program:0";
        if (editorMode) {
            return (
                <DragResizeFrame
                    key={program.id}
                    enabled
                    selected={selectedTarget === target}
                    layout={program.layout}
                    onSelect={() => onSelectTarget?.(target)}
                    onChange={(next) => onUpdateLayout?.(target, next)}
                    ariaLabel={`Edit ${program.title}`}
                    className={styles.card}
                >
                    {children}
                </DragResizeFrame>
            );
        }

        return (
            <div
                key={program.id}
                className={styles.card}
                style={resolveLayoutStyle(program.layout)}
                role="button"
                tabIndex={0}
                onClick={() => openVideo(program)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openVideo(program);
                    }
                }}
            >
                {children}
            </div>
        );
    };

    const horizontalProgram = programs[0];

    function renderLookbookItem(
        targetPrefix: "openingVideo" | "featuredVideo",
        video: VideoProject,
        idx: number,
        role: string,
    ) {
            const target = `${targetPrefix}:${idx}`;
            const selected = selectedTarget === target;
            const hasVideoUrl = hasAsset(video.videoUrl);
            const hasThumbnail = hasAsset(video.thumbnail);
            return (
                <DragResizeFrame
                    enabled={editorMode}
                    selected={selected}
                    layout={video.layout}
                    onSelect={() => onSelectTarget?.(target)}
                    onChange={(next) => onUpdateLayout?.(target, next)}
                    ariaLabel={`Edit ${video.title}`}
                    className={styles.lookbookEditableSlot}
                >
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                            event.stopPropagation();
                            onSelectTarget?.(target);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                onSelectTarget?.(target);
                            }
                        }}
                    >
                        <div className={styles.lookbookSlotMedia}>
                            {hasVideoUrl ? (
                                <video
                                    src={video.videoUrl}
                                    poster={hasThumbnail ? video.thumbnail : undefined}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                />
                            ) : hasThumbnail ? (
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    width={480}
                                    height={854}
                                    className={styles.lookbookSlotImage}
                                />
                            ) : (
                                <div className={styles.cardImagePlaceholder}>
                                    No media
                                </div>
                            )}
                        </div>
                        <h3 className={styles.lookbookSlotTitle}>
                            {role === "center" ? video.title : `${video.title}`}
                        </h3>
                    </div>
                </DragResizeFrame>
            );
    }

    return (
        <div className={styles.wrapper}>
            <h1 className={styles.visuallyHidden}>{pageTitle}</h1>

            <VideoLookbook
                title={openingSeries.title}
                description={openingSeries.description}
                videos={openingSeries.videos}
                onPlay={openVideo}
                autoplay={!editorMode}
                renderItem={
                    editorMode
                        ? (video, idx, role) =>
                              renderLookbookItem("openingVideo", video, idx, role)
                        : undefined
                }
            />

            {/* Horizontal hero video */}
            <div className={styles.list}>
                {horizontalProgram ? (
                    <div key={horizontalProgram.id}>
                        {renderEditableCard(
                            horizontalProgram,
                            <>
                            {hasAsset(horizontalProgram.thumbnail) ? (
                                <Image
                                    src={horizontalProgram.thumbnail}
                                    alt={horizontalProgram.title}
                                    width={1400}
                                    height={500}
                                    className={styles.cardImage}
                                />
                            ) : (
                                <div className={styles.cardImagePlaceholder}>
                                    No media
                                </div>
                            )}
                            <div className={styles.cardOverlay}>
                                <h2 className={styles.cardTitle}>
                                    {horizontalProgram.title}
                                </h2>
                                <p className={styles.cardSubtitle}>
                                    {horizontalProgram.subtitle}
                                </p>
                                <button
                                    type="button"
                                    className={styles.cardBtn}
                                    onClick={(event) => {
                                        if (editorMode) return;
                                        event.stopPropagation();
                                        openVideo(horizontalProgram);
                                    }}
                                >
                                    View The Program
                                </button>
                            </div>
                            </>,
                        )}
                        <div className={styles.separator} />
                    </div>
                ) : (
                    editorMode && (
                        <div className={styles.emptyState}>
                            Add one horizontal sport video from the admin panel.
                        </div>
                    )
                )}
            </div>

            <VideoLookbook
                title={featuredSeries.title}
                description={featuredSeries.description}
                videos={featuredSeries.videos}
                onPlay={openVideo}
                autoplay={!editorMode}
                renderItem={
                    editorMode
                        ? (video, idx, role) =>
                              renderLookbookItem("featuredVideo", video, idx, role)
                        : undefined
                }
            />

            <div className={styles.separator} />

            <VideoPopup
                isOpen={Boolean(activeVideo?.videoUrl.trim())}
                title={activeVideo?.title ?? ""}
                videoUrl={activeVideo?.videoUrl ?? ""}
                onClose={closeVideo}
            />
        </div>
    );
}
