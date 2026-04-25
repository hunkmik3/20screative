"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import styles from "./ProjectGrid.module.css";
import VideoPopup from "./VideoPopup";

export interface VideoProject {
    id: string;
    thumbnail: string;
    title: string;
    description: string;
    duration: string;
    videoUrl: string;
}

export interface NewestSeries {
    title: string;
    description: string;
    thumbnail: string;
    videoUrl: string;
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
}

export default function ProjectGrid({
    categoryTitle,
    categoryDescription,
    latestVideos,
    newestSeries,
    featuredSeries,
}: ProjectGridProps) {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [activeVideo, setActiveVideo] = useState<VideoProject | null>(null);

    const scrollCarousel = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 340, behavior: "smooth" });
        }
    };

    const openVideo = useCallback((video: VideoProject) => {
        setActiveVideo(video);
    }, []);

    const closeVideo = useCallback(() => {
        setActiveVideo(null);
    }, []);

    const featured = latestVideos[0];
    const sideVideos = latestVideos.slice(1, 5);

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
                {featured && (
                    <div
                        className={styles.latestFeatured}
                        role="button"
                        tabIndex={0}
                        onClick={() => openVideo(featured)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                openVideo(featured);
                            }
                        }}
                    >
                        <div className={styles.thumbnailWrapper}>
                            <Image
                                src={featured.thumbnail}
                                alt={featured.title}
                                width={800}
                                height={1000}
                                className={styles.thumbnail}
                            />
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
                    </div>
                )}

                {/* Side 2x2 Grid */}
                <div className={styles.latestSide}>
                    {sideVideos.map((video, index) => (
                        <div
                            key={video.id}
                            className={styles.card}
                            role="button"
                            tabIndex={0}
                            onClick={() => openVideo(video)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    openVideo(video);
                                }
                            }}
                        >
                            <div className={styles.thumbnailWrapper}>
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    width={400}
                                    height={225}
                                    className={styles.thumbnail}
                                    loading={index < 2 ? "eager" : "lazy"}
                                />
                                <span className={styles.duration}>
                                    {video.duration}
                                </span>
                            </div>
                            <h3 className={styles.cardTitle}>{video.title}</h3>
                            <p className={styles.cardDesc}>
                                {video.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.separator} />

            {/* ===== SECTION 2: NEWEST VIDEO ===== */}
            <h2 className={styles.sectionTitle}>Newest Video</h2>

            <div
                className={styles.newestBanner}
                role="button"
                tabIndex={0}
                onClick={() =>
                    openVideo({
                        id: `${categoryTitle.toLowerCase()}-newest`,
                        title: newestSeries.title,
                        description: newestSeries.description,
                        thumbnail: newestSeries.thumbnail,
                        duration: "",
                        videoUrl: newestSeries.videoUrl,
                    })
                }
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        openVideo({
                            id: `${categoryTitle.toLowerCase()}-newest`,
                            title: newestSeries.title,
                            description: newestSeries.description,
                            thumbnail: newestSeries.thumbnail,
                            duration: "",
                            videoUrl: newestSeries.videoUrl,
                        });
                    }
                }}
            >
                <Image
                    src={newestSeries.thumbnail}
                    alt={newestSeries.title}
                    width={1400}
                    height={500}
                    className={styles.bannerImage}
                />
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
            </div>

            <div className={styles.separator} />

            {/* ===== SECTION 3: FEATURED VIDEO ===== */}
            <h2 className={styles.sectionTitle}>Featured Video</h2>

            <div className={styles.featuredSection}>
                {/* Left Info */}
                <div className={styles.featuredInfo}>
                    <h3 className={styles.featuredTitle}>
                        {featuredSeries.title}
                    </h3>
                    <span className={styles.featuredCount}>
                        {featuredSeries.videoCount} Videos
                    </span>
                    <p className={styles.featuredDesc}>
                        {featuredSeries.description}
                    </p>
                    <button
                        type="button"
                        className={styles.playBtn}
                        aria-label="Play series"
                        onClick={() => {
                            const firstVideo = featuredSeries.videos[0];
                            if (firstVideo) openVideo(firstVideo);
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

                {/* Right Carousel */}
                <div className={styles.carouselWrapper}>
                    <div ref={carouselRef} className={styles.carousel}>
                        {featuredSeries.videos.map((video) => (
                            <div
                                key={video.id}
                                className={styles.carouselCard}
                                role="button"
                                tabIndex={0}
                                onClick={() => openVideo(video)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        openVideo(video);
                                    }
                                }}
                            >
                                <div className={styles.thumbnailWrapper}>
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        width={400}
                                        height={225}
                                        className={styles.thumbnail}
                                    />
                                    <span className={styles.duration}>
                                        {video.duration}
                                    </span>
                                </div>
                                <h3 className={styles.cardTitle}>
                                    {video.title}
                                </h3>
                            </div>
                        ))}
                    </div>
                    <button
                        className={styles.carouselArrow}
                        onClick={scrollCarousel}
                        aria-label="Scroll right"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,6 15,12 9,18" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.separator} />

            <VideoPopup
                isOpen={Boolean(activeVideo)}
                title={activeVideo?.title ?? ""}
                videoUrl={activeVideo?.videoUrl ?? ""}
                onClose={closeVideo}
            />
        </div>
    );
}
