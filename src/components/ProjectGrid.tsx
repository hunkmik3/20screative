"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";
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
    const isCommercialLayout = categoryTitle.trim().toLowerCase() === "commercial";
    const [activeVideo, setActiveVideo] = useState<VideoProject | null>(null);
    const initialCommercialBottomDisplayIndex =
        latestVideos.slice(3, 9).length > 1 ? 1 : 0;
    const [commercialBottomDisplayIndex, setCommercialBottomDisplayIndex] =
        useState(initialCommercialBottomDisplayIndex);
    const [commercialBottomTrackAnimate, setCommercialBottomTrackAnimate] =
        useState(true);
    const [commercialBottomViewportWidth, setCommercialBottomViewportWidth] =
        useState(0);
    const [commercialTopCardWidth, setCommercialTopCardWidth] = useState(0);
    const commercialBottomViewportRef = useRef<HTMLDivElement>(null);

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
    const commercialTopVideos = latestVideos.slice(1, 3);
    const commercialBottomCarouselVideos = latestVideos.slice(3, 9);
    const commercialBottomCarouselCount = commercialBottomCarouselVideos.length;
    const hasCommercialBottomLoop = commercialBottomCarouselCount > 1;
    const commercialBottomExpandedVideos = hasCommercialBottomLoop
        ? [
              commercialBottomCarouselVideos[commercialBottomCarouselCount - 1],
              ...commercialBottomCarouselVideos,
              commercialBottomCarouselVideos[0],
          ]
        : commercialBottomCarouselVideos;
    const effectiveCommercialBottomDisplayIndex = hasCommercialBottomLoop
        ? commercialBottomDisplayIndex
        : Math.min(
              commercialBottomDisplayIndex,
              Math.max(0, commercialBottomCarouselCount - 1),
          );
    const activeCommercialBottomIndex =
        commercialBottomCarouselCount > 0
            ? hasCommercialBottomLoop
                ? (((commercialBottomDisplayIndex - 1) % commercialBottomCarouselCount) +
                      commercialBottomCarouselCount) %
                  commercialBottomCarouselCount
                : Math.min(commercialBottomDisplayIndex, commercialBottomCarouselCount - 1)
            : 0;
    const commercialBottomSlideGapPx = 20;
    const commercialBottomScale = 1.69;
    const desiredSideVisibleWidthPx =
        commercialTopCardWidth > 0
            ? commercialTopCardWidth
            : commercialBottomViewportWidth * 0.18;
    const commercialBottomSideInsetPx =
        commercialBottomViewportWidth > 0
            ? Math.max(
                  24,
                  Math.min(
                      desiredSideVisibleWidthPx + commercialBottomSlideGapPx,
                      commercialBottomViewportWidth * 0.42,
                  ),
              )
            : 0;
    const commercialBottomSlideWidthPx =
        commercialBottomViewportWidth > 0
            ? Math.max(
                  280,
                  Math.min(
                      commercialBottomViewportWidth * 0.98,
                      (commercialBottomViewportWidth - commercialBottomSideInsetPx * 2) *
                          commercialBottomScale,
                  ),
              )
            : 0;
    const commercialBottomBaseOffsetPx =
        commercialBottomViewportWidth > 0
            ? (commercialBottomViewportWidth - commercialBottomSlideWidthPx) / 2
            : 0;
    const commercialBottomStepPx =
        commercialBottomSlideWidthPx > 0
            ? commercialBottomSlideWidthPx + commercialBottomSlideGapPx
            : 0;
    const commercialBottomViewportStyle: CSSProperties = {
        ["--latest-bottom-slide-width" as string]: `${commercialBottomSlideWidthPx}px`,
    };

    useEffect(() => {
        if (!isCommercialLayout) return;
        const updateViewportWidth = () => {
            setCommercialBottomViewportWidth(
                commercialBottomViewportRef.current?.clientWidth ?? 0,
            );
            const topCardElement = document.querySelector(
                `.${styles.latestTopCard}`,
            ) as HTMLElement | null;
            setCommercialTopCardWidth(topCardElement?.clientWidth ?? 0);
        };

        updateViewportWidth();
        window.addEventListener("resize", updateViewportWidth);
        return () => window.removeEventListener("resize", updateViewportWidth);
    }, [isCommercialLayout]);

    const handleCommercialBottomTrackTransitionEnd = () => {
        if (!hasCommercialBottomLoop) return;
        if (commercialBottomDisplayIndex === 0) {
            setCommercialBottomTrackAnimate(false);
            setCommercialBottomDisplayIndex(commercialBottomCarouselCount);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setCommercialBottomTrackAnimate(true));
            });
            return;
        }
        if (commercialBottomDisplayIndex === commercialBottomCarouselCount + 1) {
            setCommercialBottomTrackAnimate(false);
            setCommercialBottomDisplayIndex(1);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setCommercialBottomTrackAnimate(true));
            });
        }
    };

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

            <div
                className={`${styles.latestGrid} ${
                    isCommercialLayout ? styles.latestGridCommercial : ""
                }`}
            >
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

                {isCommercialLayout ? (
                    <>
                        <div className={`${styles.latestSide} ${styles.latestSideCommercial}`}>
                            <div className={styles.latestSideTopRow}>
                                {commercialTopVideos.map((video, index) =>
                                    renderEditableFrame({
                                        key: video.id,
                                        target: `latest:${index + 1}`,
                                        className: `${styles.card} ${styles.latestTopCard}`,
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
                                                        width: 720,
                                                        height: 720,
                                                        preload: "auto",
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

                        {commercialBottomCarouselVideos.length > 0 && (
                            <div className={styles.latestBottomCarouselFull}>
                                <div className={styles.latestBottomCarousel}>
                                    <div
                                        ref={commercialBottomViewportRef}
                                        className={styles.latestBottomViewport}
                                        style={commercialBottomViewportStyle}
                                    >
                                        <div
                                            className={styles.latestBottomTrack}
                                            style={{
                                                transform: `translateX(${
                                                    commercialBottomBaseOffsetPx -
                                                    effectiveCommercialBottomDisplayIndex *
                                                        commercialBottomStepPx
                                                }px)`,
                                                transition: commercialBottomTrackAnimate
                                                    ? undefined
                                                    : "none",
                                            }}
                                            onTransitionEnd={handleCommercialBottomTrackTransitionEnd}
                                        >
                                            {commercialBottomExpandedVideos.map((video, displayIdx) => {
                                                const realIndex = hasCommercialBottomLoop
                                                    ? displayIdx === 0
                                                        ? commercialBottomCarouselCount - 1
                                                        : displayIdx ===
                                                            commercialBottomCarouselCount + 1
                                                          ? 0
                                                          : displayIdx - 1
                                                    : displayIdx;
                                                return renderEditableFrame({
                                                    key: `${video.id}-carousel-${displayIdx}`,
                                                    target: `latest:${realIndex + 3}`,
                                                    className: `${styles.card} ${styles.latestBottomSlide} ${
                                                        displayIdx ===
                                                        effectiveCommercialBottomDisplayIndex
                                                            ? styles.latestBottomSlideActive
                                                            : ""
                                                    }`,
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
                                                                    width: 1280,
                                                                    height: 720,
                                                                    preload:
                                                                        realIndex < 2
                                                                            ? "auto"
                                                                            : "metadata",
                                                                })}
                                                                <span className={styles.duration}>
                                                                    {video.duration}
                                                                </span>
                                                            </div>
                                                            <h3 className={styles.cardTitle}>
                                                                {video.title}
                                                            </h3>
                                                            <p className={styles.cardDesc}>
                                                                {video.description}
                                                            </p>
                                                        </>
                                                    ),
                                                });
                                        })}
                                        </div>
                                    </div>

                                    {commercialBottomCarouselVideos.length > 1 && (
                                        <div className={styles.latestBottomControls}>
                                            <button
                                                type="button"
                                                className={styles.latestBottomArrow}
                                                onClick={() =>
                                                    setCommercialBottomDisplayIndex(
                                                        (current) => current - 1,
                                                    )
                                                }
                                                aria-label="Previous video"
                                            >
                                                <span aria-hidden="true">‹</span>
                                            </button>
                                            <div className={styles.latestBottomDots}>
                                                {commercialBottomCarouselVideos.map(
                                                    (video, index) => (
                                                        <button
                                                            key={`${video.id}-dot`}
                                                            type="button"
                                                            className={
                                                                index ===
                                                                activeCommercialBottomIndex
                                                                    ? styles.latestBottomDotActive
                                                                    : styles.latestBottomDot
                                                            }
                                                            onClick={() =>
                                                                setCommercialBottomDisplayIndex(
                                                                    hasCommercialBottomLoop
                                                                        ? index + 1
                                                                        : index,
                                                                )
                                                            }
                                                            aria-label={`Go to video ${index + 1}`}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.latestBottomArrow}
                                                onClick={() =>
                                                    setCommercialBottomDisplayIndex(
                                                        (current) => current + 1,
                                                    )
                                                }
                                                aria-label="Next video"
                                            >
                                                <span aria-hidden="true">›</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
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
                )}
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
