"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import type { VideoProject } from "./ProjectGrid";
import styles from "./VideoLookbook.module.css";

type SlotRole = "farLeft" | "left" | "center" | "right" | "farRight";

interface Props {
  title: string;
  description: string;
  videos: VideoProject[];
  onPlay?: (video: VideoProject) => void;
  autoplay?: boolean;
  renderItem?: (
    video: VideoProject,
    index: number,
    role: SlotRole,
  ) => ReactNode;
}

const AUTO_INTERVAL_MS = 4500;

const hasAsset = (value?: string | null) => Boolean(value?.trim());

function modIndex(i: number, n: number) {
  return ((i % n) + n) % n;
}

export default function VideoLookbook({
  title,
  description,
  videos,
  onPlay,
  autoplay = true,
  renderItem,
}: Props) {
  const N = videos.length;
  const [active, setActive] = useState(0);

  // Auto-advance
  useEffect(() => {
    if (!autoplay) return;
    if (N < 2) return;
    const timer = window.setTimeout(() => {
      setActive((prev) => modIndex(prev + 1, N));
    }, AUTO_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [active, autoplay, N]);

  const slots = useMemo<{ video: VideoProject; role: SlotRole }[]>(() => {
    if (N === 0) return [];
    if (N === 1) return [{ video: videos[0], role: "center" }];
    if (N === 2) {
      return [
        { video: videos[modIndex(active, N)], role: "center" },
        { video: videos[modIndex(active + 1, N)], role: "right" },
      ];
    }
    if (N === 3) {
      return [
        { video: videos[modIndex(active - 1, N)], role: "left" },
        { video: videos[modIndex(active, N)], role: "center" },
        { video: videos[modIndex(active + 1, N)], role: "right" },
      ];
    }
    if (N === 4) {
      return [
        { video: videos[modIndex(active - 2, N)], role: "farLeft" },
        { video: videos[modIndex(active - 1, N)], role: "left" },
        { video: videos[modIndex(active, N)], role: "center" },
        { video: videos[modIndex(active + 1, N)], role: "right" },
      ];
    }
    return [
      { video: videos[modIndex(active - 2, N)], role: "farLeft" },
      { video: videos[modIndex(active - 1, N)], role: "left" },
      { video: videos[modIndex(active, N)], role: "center" },
      { video: videos[modIndex(active + 1, N)], role: "right" },
      { video: videos[modIndex(active + 2, N)], role: "farRight" },
    ];
  }, [active, videos, N]);

  if (N === 0) return null;

  const handlePrev = () => setActive((prev) => modIndex(prev - 1, N));
  const handleNext = () => setActive((prev) => modIndex(prev + 1, N));

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <p className={styles.kicker}>Video lookbook</p>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>

      <div className={styles.stage}>
        {N > 1 && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={handlePrev}
            aria-label="Trước"
          >
            <span aria-hidden>‹</span>
          </button>
        )}

        <div className={styles.cards}>
          {slots.map(({ video, role }) => {
            const isCenter = role === "center";
            const hasVideoUrl = hasAsset(video.videoUrl);
            const hasThumbnail = hasAsset(video.thumbnail);
            const positionClass =
              role === "farLeft"
                ? styles.cardFarLeft
                : role === "left"
                  ? styles.cardLeft
                  : role === "farRight"
                    ? styles.cardFarRight
                    : role === "right"
                      ? styles.cardRight
                      : styles.cardCenter;
            const handleClick = () => {
              if (isCenter) {
                if (hasVideoUrl) onPlay?.(video);
              } else if (role === "left") {
                setActive((prev) => modIndex(prev - 1, N));
              } else if (role === "farLeft") {
                setActive((prev) => modIndex(prev - 2, N));
              } else if (role === "right") {
                setActive((prev) => modIndex(prev + 1, N));
              } else if (role === "farRight") {
                setActive((prev) => modIndex(prev + 2, N));
              }
            };
            return (
              <button
                type="button"
                key={`${video.id}-${role}`}
                className={`${styles.card} ${positionClass}`}
                onClick={handleClick}
                aria-label={
                  isCenter ? `Phát ${video.title}` : `Chuyển ${video.title}`
                }
              >
                {renderItem ? (
                  renderItem(video, videos.indexOf(video), role)
                ) : (
                  <>
                    <div className={styles.media}>
                      {hasVideoUrl ? (
                        <video
                          className={styles.video}
                          src={video.videoUrl}
                          poster={hasThumbnail ? video.thumbnail : undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />
                      ) : hasThumbnail ? (
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          width={720}
                          height={1280}
                          className={styles.video}
                        />
                      ) : (
                        <div className={styles.mediaPlaceholder}>
                          No media
                        </div>
                      )}
                      {video.duration && (
                        <span className={styles.duration}>{video.duration}</span>
                      )}
                      {isCenter && (
                        <span className={styles.playBadge} aria-hidden>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="9,7 18,12 9,17" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h3 className={styles.cardTitle}>{video.title}</h3>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {N > 1 && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={handleNext}
            aria-label="Tiếp"
          >
            <span aria-hidden>›</span>
          </button>
        )}
      </div>

      {N > 1 && (
        <div className={styles.dots}>
          {videos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              className={index === active ? styles.dotActive : styles.dot}
              onClick={() => setActive(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
