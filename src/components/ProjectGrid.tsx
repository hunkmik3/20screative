"use client";

import { useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import DragResizeFrame from "@/components/DragResizeFrame";
import type { FashionLayout } from "@/data/fashionPage";
import { resolveLayoutStyle } from "@/lib/fashionLayoutStyle";
import styles from "./ProjectGrid.module.css";
import VideoLookbook from "./VideoLookbook";
import VideoPopup from "./VideoPopup";

export interface VideoProject {
    id: string;
    thumbnail: string;
    title: string;
    description: string;
    duration: string;
    videoUrl: string;
    layout?: FashionLayout;
}

export interface NewestSeries {
    title: string;
    description: string;
    thumbnail: string;
    videoUrl: string;
    layout?: FashionLayout;
}

export interface FeaturedSeries {
    title: string;
    videoCount: number;
    description: string;
    videos: VideoProject[];
}

interface ProjectGridProps {
    categoryTitle: string;
    categoryDescription: string;
    latestVideos: VideoProject[];
    newestSeries: NewestSeries;
    featuredSeries: FeaturedSeries;
    editorMode?: boolean;
    selectedTarget?: string | null;
    onSelectTarget?: (target: string) => void;
    onUpdateLayout?: (target: string, next: FashionLayout) => void;
}

const hasAsset = (value?: string | null) => Boolean(value?.trim());

export default function ProjectGrid({
    categoryTitle,
    categoryDescription,
    latestVideos,
    newestSeries,
    featuredSeries,
    editorMode = false,
    selectedTarget = null,
    onSelectTarget,
    onUpdateLayout,
}: ProjectGridProps) {
    const [activeVideo, setActiveVideo] = useState<VideoProject | null>(null);

    const openVideo = useCallback((video: VideoProject) => {
        if (!hasAsset(video.videoUrl)) return;
        setActiveVideo(video);
    }, []);

    const closeVideo = useCallback(() => {
        setActiveVideo(null);
    }, []);

    const featured = latestVideos[0];
    const sideVideos = latestVideos.slice(1, 5);

    const renderEditableFrame = ({
        key,
        target,
        className,
        layout,
        ariaLabel,
        onActivate,
        children,
    }: {
        key: string;
        target: string;
        className: string;
        layout?: FashionLayout;
        ariaLabel: string;
        onActivate?: () => void;
        children: ReactNode;
    }) => {
        if (editorMode) {
            return (
                <DragResizeFrame
                    key={key}
                    enabled
                    selected={selectedTarget === target}
                    layout={layout}
                    onSelect={() => onSelectTarget?.(target)}
                    onChange={(next) => onUpdateLayout?.(target, next)}
                    ariaLabel={ariaLabel}
                    className={className}
                >
                    {children}
                </DragResizeFrame>
            );
        }

        return (
            <div
                key={key}
                className={className}
                style={resolveLayoutStyle(layout)}
                role={onActivate ? "button" : undefined}
                tabIndex={onActivate ? 0 : undefined}
                onClick={onActivate}
                onKeyDown={(event) => {
                    if (!onActivate) return;
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onActivate();
                    }
                }}
            >
                {children}
            </div>
        );
    };

    return (
        <div className={styles.wrapper}>
            {/* Page Header */}
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>{categoryTitle}</h1>
                <p className={styles.pageSubtitle}>{categoryDescription}</p>
            </div>

            <div className={styles.separator} />

            {/* ===== SECTION 1: LATEST VIDEOS ===== */}
            <h2 className={styles.sectionTitle}>Latest Videos</h2>

            <div className={styles.latestGrid}>
                {/* Featured Large Card */}
                {featured &&
                    renderEditableFrame({
                        key: featured.id,
                        target: "latest:0",
                        className: styles.latestFeatured,
                        layout: featured.layout,
                        ariaLabel: `Edit ${featured.title}`,
                        onActivate: () => openVideo(featured),
                        children: (
                            <>
                        <div className={styles.thumbnailWrapper}>
                            {hasAsset(featured.thumbnail) ? (
                                <Image
                                    src={featured.thumbnail}
                                    alt={featured.title}
                                    width={800}
                                    height={1000}
                                    className={styles.thumbnail}
                                />
                            ) : (
                                <div className={styles.mediaPlaceholder}>
                                    No media
                                </div>
                            )}
                            <span className={styles.duration}>
                                {featured.duration}
                            </span>
                        </div>
                        <h3 className={styles.cardTitleLarge}>
                            {featured.title}
                        </h3>
                        <p className={styles.cardDesc}>
                            {featured.description}
                        </p>
                            </>
                        ),
                    })}

                {/* Side 2x2 Grid */}
                <div className={styles.latestSide}>
                    {sideVideos.map((video, index) =>
                        renderEditableFrame({
                            key: video.id,
                            target: `latest:${index + 1}`,
                            className: styles.card,
                            layout: video.layout,
                            ariaLabel: `Edit ${video.title}`,
                            onActivate: () => openVideo(video),
                            children: (
                                <>
                            <div className={styles.thumbnailWrapper}>
                                {hasAsset(video.thumbnail) ? (
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        width={400}
                                        height={225}
                                        className={styles.thumbnail}
                                        loading={index < 2 ? "eager" : "lazy"}
                                    />
                                ) : (
                                    <div className={styles.mediaPlaceholder}>
                                        No media
                                    </div>
                                )}
                                <span className={styles.duration}>
                                    {video.duration}
                                </span>
                            </div>
                            <h3 className={styles.cardTitle}>{video.title}</h3>
                            <p className={styles.cardDesc}>
                                {video.description}
                            </p>
                                </>
                            ),
                        }),
                    )}
                </div>
            </div>

            <div className={styles.separator} />

            {/* ===== SECTION 2: NEWEST VIDEO ===== */}
            <h2 className={styles.sectionTitle}>Newest Video</h2>

            {renderEditableFrame({
                key: "newest",
                target: "newest",
                className: styles.newestBanner,
                layout: newestSeries.layout,
                ariaLabel: `Edit ${newestSeries.title}`,
                onActivate: () =>
                    openVideo({
                        id: `${categoryTitle.toLowerCase()}-newest`,
                        title: newestSeries.title,
                        description: newestSeries.description,
                        thumbnail: newestSeries.thumbnail,
                        duration: "",
                        videoUrl: newestSeries.videoUrl,
                    }),
                children: (
                    <>
                {hasAsset(newestSeries.thumbnail) ? (
                    <Image
                        src={newestSeries.thumbnail}
                        alt={newestSeries.title}
                        width={1400}
                        height={500}
                        className={styles.bannerImage}
                    />
                ) : (
                    <div className={`${styles.mediaPlaceholder} ${styles.bannerPlaceholder}`}>
                        No media
                    </div>
                )}
                <div className={styles.bannerOverlay}>
                    <h3 className={styles.bannerTitle}>
                        {newestSeries.title}
                    </h3>
                    <p className={styles.bannerDesc}>
                        {newestSeries.description}
                    </p>
                    <button
                        type="button"
                        className={styles.playBtn}
                        aria-label="Play video"
                        onClick={(event) => {
                            if (editorMode) return;
                            event.stopPropagation();
                            openVideo({
                                id: `${categoryTitle.toLowerCase()}-newest`,
                                title: newestSeries.title,
                                description: newestSeries.description,
                                thumbnail: newestSeries.thumbnail,
                                duration: "",
                                videoUrl: newestSeries.videoUrl,
                            });
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <circle cx="12" cy="12" r="11" />
                            <polygon
                                points="10,8 16,12 10,16"
                                fill="currentColor"
                                stroke="none"
                            />
                        </svg>
                    </button>
                </div>
                    </>
                ),
            })}

            <div className={styles.separator} />

            {/* ===== SECTION 3: VIDEO LOOKBOOK (vertical) ===== */}
            <VideoLookbook
                title={featuredSeries.title}
                description={featuredSeries.description}
                videos={featuredSeries.videos}
                onPlay={openVideo}
                autoplay={!editorMode}
                renderItem={
                    editorMode
                        ? (video, idx, role) => {
                              const target = `featuredVideo:${idx}`;
                              const selected = selectedTarget === target;
                              const hasVideoUrl = hasAsset(video.videoUrl);
                              const hasThumbnail = hasAsset(video.thumbnail);
                              return (
                                  <div
                                      className={`${styles.lookbookEditableSlot} ${
                                          selected ? styles.lookbookEditableSlotSelected : ""
                                      }`}
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
                                              <div className={styles.mediaPlaceholder}>
                                                  No media
                                              </div>
                                          )}
                                      </div>
                                      <h3 className={styles.cardTitle}>
                                          {role === "center" ? video.title : `${video.title}`}
                                      </h3>
                                  </div>
                              );
                          }
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
