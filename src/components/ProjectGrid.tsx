"use client";

import { useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import AutoplayVideoPreview from "@/components/AutoplayVideoPreview";
import DragResizeFrame from "@/components/DragResizeFrame";
import RevealText from "@/components/RevealText";
import type { FashionLayout } from "@/data/fashionPage";
import {
    getCloudflareStreamDownloadUrl,
    getCloudflareStreamThumbnailUrl,
    hasCloudflareStreamConfig,
} from "@/lib/cloudflareStream";
import { resolveLayoutStyle } from "@/lib/fashionLayoutStyle";
import { isVideoFileUrl, isYoutubeUrl } from "@/lib/videoEmbed";
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
    streamUid?: string;
    streamSourceUrl?: string;
    layout?: FashionLayout;
}

export interface NewestSeries {
    title: string;
    description: string;
    thumbnail: string;
    videoUrl: string;
    streamUid?: string;
    streamSourceUrl?: string;
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
        const canUseStream =
            hasAsset(video.streamUid) && hasCloudflareStreamConfig();
        if (!canUseStream && !hasAsset(video.videoUrl)) return;
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

    const renderPreviewMedia = ({
        title,
        thumbnail,
        videoUrl,
        streamUid,
        className,
        width,
        height,
        preload = "metadata",
    }: Pick<VideoProject, "title" | "thumbnail" | "videoUrl" | "streamUid"> & {
        className: string;
        width: number;
        height: number;
        preload?: "none" | "metadata" | "auto";
    }) => {
        const canUseStream = hasAsset(streamUid) && hasCloudflareStreamConfig();
        const streamVideoUrl = getCloudflareStreamDownloadUrl(streamUid);
        const streamThumbnail = getCloudflareStreamThumbnailUrl(streamUid);
        const posterUrl =
            hasAsset(thumbnail) && !isVideoFileUrl(thumbnail)
                ? thumbnail
                : streamThumbnail ?? "";

        if (canUseStream && streamVideoUrl) {
            return (
                <AutoplayVideoPreview
                    src={streamVideoUrl}
                    fallbackSrc={
                        hasAsset(videoUrl) && !isYoutubeUrl(videoUrl)
                            ? videoUrl
                            : undefined
                    }
                    preload={preload}
                    className={className}
                    posterUrl={hasAsset(posterUrl) ? posterUrl : undefined}
                />
            );
        }

        if (hasAsset(videoUrl) && !isYoutubeUrl(videoUrl)) {
            return (
                <AutoplayVideoPreview
                    src={videoUrl}
                    posterUrl={hasAsset(posterUrl) ? posterUrl : undefined}
                    className={className}
                    preload={preload}
                />
            );
        }

        if (hasAsset(posterUrl)) {
            return (
                <Image
                    src={posterUrl}
                    alt={title}
                    width={width}
                    height={height}
                    className={className}
                />
            );
        }

        return <div className={styles.mediaPlaceholder}>No media</div>;
    };

    return (
        <div className={styles.wrapper}>
            {/* Page Header */}
            <div className={styles.header}>
                <RevealText
                    as="h1"
                    className={styles.pageTitle}
                    text={categoryTitle}
                    staggerMs={46}
                />
                <p className={styles.pageSubtitle}>{categoryDescription}</p>
            </div>

            <div className={styles.separator} />

            {/* ===== SECTION 1: LATEST VIDEOS ===== */}
            <RevealText
                as="h2"
                className={styles.sectionTitle}
                text="Latest Videos"
                staggerMs={42}
            />

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
                            {renderPreviewMedia({
                                title: featured.title,
                                thumbnail: featured.thumbnail,
                                videoUrl: featured.videoUrl,
                                streamUid: featured.streamUid,
                                className: styles.thumbnail,
                                width: 800,
                                height: 1000,
                                preload: "auto",
                            })}
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
                                {renderPreviewMedia({
                                    title: video.title,
                                    thumbnail: video.thumbnail,
                                    videoUrl: video.videoUrl,
                                    streamUid: video.streamUid,
                                    className: styles.thumbnail,
                                    width: 400,
                                    height: 225,
                                    preload: index < 2 ? "auto" : "metadata",
                                })}
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
            <RevealText
                as="h2"
                className={styles.sectionTitle}
                text="Newest Video"
                staggerMs={42}
            />

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
                        streamUid: newestSeries.streamUid,
                    }),
                children: (
                    <>
                {renderPreviewMedia({
                    title: newestSeries.title,
                    thumbnail: newestSeries.thumbnail,
                    videoUrl: newestSeries.videoUrl,
                    streamUid: newestSeries.streamUid,
                    className: styles.bannerImage,
                    width: 1400,
                    height: 500,
                    preload: "auto",
                })}
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
                                streamUid: newestSeries.streamUid,
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
                              const canUseStream =
                                  hasAsset(video.streamUid) &&
                                  hasCloudflareStreamConfig();
                              const streamVideoUrl =
                                  getCloudflareStreamDownloadUrl(video.streamUid);
                              const hasThumbnail =
                                  hasAsset(video.thumbnail) &&
                                  !isVideoFileUrl(video.thumbnail);
                              const streamThumbnail =
                                  getCloudflareStreamThumbnailUrl(video.streamUid);
                              const posterUrl = hasThumbnail
                                  ? video.thumbnail
                                  : streamThumbnail ?? undefined;
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
                                          {canUseStream && streamVideoUrl ? (
                                              <AutoplayVideoPreview
                                                  src={streamVideoUrl}
                                                  fallbackSrc={
                                                      hasVideoUrl && !isYoutubeUrl(video.videoUrl)
                                                          ? video.videoUrl
                                                          : undefined
                                                  }
                                                  className={styles.lookbookSlotImage}
                                                  preload="metadata"
                                                  posterUrl={posterUrl}
                                              />
                                          ) : hasVideoUrl ? (
                                              <video
                                                  src={video.videoUrl}
                                                  poster={posterUrl}
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
                isOpen={Boolean(
                    activeVideo?.streamUid?.trim() || activeVideo?.videoUrl.trim(),
                )}
                title={activeVideo?.title ?? ""}
                videoUrl={activeVideo?.videoUrl ?? ""}
                streamUid={activeVideo?.streamUid}
                onClose={closeVideo}
            />
        </div>
    );
}
