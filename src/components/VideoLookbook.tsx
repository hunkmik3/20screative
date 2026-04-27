"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import Image from "next/image";
import AutoplayVideoPreview from "./AutoplayVideoPreview";
import RevealText from "./RevealText";
import {
  getCloudflareStreamDownloadUrl,
  getCloudflareStreamThumbnailUrl,
  hasCloudflareStreamConfig,
} from "@/lib/cloudflareStream";
import { isVideoFileUrl, isYoutubeUrl } from "@/lib/videoEmbed";
import type { VideoProject } from "./ProjectGrid";
import styles from "./VideoLookbook.module.css";

type SlotRole = "farLeft" | "left" | "center" | "right" | "farRight";

interface Props {
  title: string;
  description: string;
  videos: VideoProject[];
  onPlay?: (video: VideoProject) => void;
  autoplay?: boolean;
  openOnCardClick?: boolean;
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

function previewPreloadFor(role: SlotRole) {
  return role === "center" || role === "left" || role === "right"
    ? "auto"
    : "metadata";
}

function previewDelayFor(role: SlotRole) {
  if (role === "center") return 0;
  if (role === "left" || role === "right") return 90;
  return 180;
}

export default function VideoLookbook({
  title,
  description,
  videos,
  onPlay,
  autoplay = true,
  openOnCardClick = false,
  renderItem,
}: Props) {
  const N = videos.length;
  const [active, setActive] = useState(0);
  const [canPlayPreviews, setCanPlayPreviews] = useState(false);
  const [autoplayStopped, setAutoplayStopped] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const wheelRemainderRef = useRef(0);
  const lastWheelStepAtRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchDeltaXRef = useRef(0);
  const touchGestureRef = useRef<"none" | "horizontal" | "vertical">("none");
  const suppressCardClickUntilRef = useRef(0);

  // Auto-advance
  useEffect(() => {
    if (!autoplay || autoplayStopped) return;
    if (N < 2) return;
    const timer = window.setTimeout(() => {
      setActive((prev) => modIndex(prev + 1, N));
    }, AUTO_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [active, autoplay, N, autoplayStopped]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => {
        setCanPlayPreviews(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCanPlayPreviews(entry.isIntersecting);
      },
      { rootMargin: "520px 0px", threshold: 0 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
    };
  }, []);

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

  const handleStageWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (N < 2) return;

    const horizontalDelta =
      Math.abs(event.deltaX) > Math.max(8, Math.abs(event.deltaY) * 1.15)
        ? event.deltaX
        : event.shiftKey && Math.abs(event.deltaY) > 8
          ? event.deltaY
          : 0;

    if (!horizontalDelta) return;

    event.preventDefault();
    event.stopPropagation();

    if (wheelResetTimerRef.current !== null) {
      window.clearTimeout(wheelResetTimerRef.current);
    }
    wheelResetTimerRef.current = window.setTimeout(() => {
      wheelRemainderRef.current = 0;
      wheelResetTimerRef.current = null;
    }, 180);

    wheelRemainderRef.current += horizontalDelta;

    const threshold = 78;
    if (Math.abs(wheelRemainderRef.current) < threshold) return;

    const now = window.performance.now();
    if (now - lastWheelStepAtRef.current < 150) return;

    const steps = wheelRemainderRef.current > 0 ? 1 : -1;
    wheelRemainderRef.current -= steps * threshold;
    lastWheelStepAtRef.current = now;
    setAutoplayStopped(true);
    setActive((prev) => modIndex(prev + steps, N));
  };

  const handleStageTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (N < 2) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchDeltaXRef.current = 0;
    touchGestureRef.current = "none";
  };

  const handleStageTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (N < 2) return;
    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    touchDeltaXRef.current = deltaX;

    if (touchGestureRef.current === "none") {
      if (Math.abs(deltaX) > Math.abs(deltaY) + 8) {
        touchGestureRef.current = "horizontal";
      } else if (Math.abs(deltaY) > Math.abs(deltaX) + 8) {
        touchGestureRef.current = "vertical";
      }
    }

    if (touchGestureRef.current === "horizontal") {
      event.preventDefault();
    }
  };

  const handleStageTouchEnd = () => {
    if (N < 2) return;
    if (touchGestureRef.current !== "horizontal") return;

    const threshold = 36;
    const deltaX = touchDeltaXRef.current;
    if (Math.abs(deltaX) < threshold) return;

    setAutoplayStopped(true);
    suppressCardClickUntilRef.current = window.performance.now() + 260;
    if (deltaX > 0) {
      handlePrev();
      return;
    }
    handleNext();
  };

  return (
    <section ref={sectionRef} className={styles.section}>
      <header className={styles.header}>
        <RevealText
          as="p"
          className={styles.kicker}
          text="Video lookbook"
          staggerMs={36}
        />
        <RevealText
          as="h2"
          className={styles.title}
          text={title}
          delayMs={120}
          staggerMs={58}
        />
        {description && <p className={styles.description}>{description}</p>}
      </header>

      <div
        className={styles.stage}
        onWheel={handleStageWheel}
        onTouchStart={handleStageTouchStart}
        onTouchMove={handleStageTouchMove}
        onTouchEnd={handleStageTouchEnd}
        onTouchCancel={handleStageTouchEnd}
      >
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
            const canUseNativePreview =
              hasVideoUrl && !isYoutubeUrl(video.videoUrl);
            const hasStreamUid =
              hasAsset(video.streamUid) && hasCloudflareStreamConfig();
            const streamVideoUrl = getCloudflareStreamDownloadUrl(video.streamUid);
            const isPlayable = hasStreamUid || hasVideoUrl;
            const hasThumbnail =
              hasAsset(video.thumbnail) && !isVideoFileUrl(video.thumbnail);
            const streamThumbnail = getCloudflareStreamThumbnailUrl(video.streamUid);
            const posterSrc = hasThumbnail
              ? video.thumbnail
              : streamThumbnail ?? "";
            const hasPoster = hasAsset(posterSrc);
            const shouldPlayInline =
              canPlayPreviews &&
              isPlayable;
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
              if (window.performance.now() < suppressCardClickUntilRef.current) {
                return;
              }
              if (openOnCardClick && isPlayable) {
                onPlay?.(video);
              } else if (isCenter) {
                if (isPlayable) onPlay?.(video);
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
              <div
                key={video.id}
                role="button"
                tabIndex={0}
                className={`${styles.card} ${positionClass}`}
                onClick={handleClick}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  handleClick();
                }}
                aria-label={
                  openOnCardClick || isCenter
                    ? `Phát ${video.title}`
                    : `Chuyển ${video.title}`
                }
              >
                {renderItem ? (
                  renderItem(video, videos.indexOf(video), role)
                ) : (
                  <>
                    <div className={styles.media}>
                      {shouldPlayInline && hasStreamUid && streamVideoUrl ? (
                        <AutoplayVideoPreview
                          src={streamVideoUrl}
                          fallbackSrc={
                            canUseNativePreview ? video.videoUrl : undefined
                          }
                          className={`${styles.video} ${styles.previewFrame}`}
                          preload={previewPreloadFor(role)}
                          startDelayMs={previewDelayFor(role)}
                          posterUrl={hasPoster ? posterSrc : undefined}
                        />
                      ) : shouldPlayInline && canUseNativePreview ? (
                        <AutoplayVideoPreview
                          src={video.videoUrl}
                          posterUrl={hasPoster ? posterSrc : undefined}
                          className={`${styles.video} ${styles.previewFrame}`}
                          preload={previewPreloadFor(role)}
                          startDelayMs={previewDelayFor(role)}
                        />
                      ) : hasPoster ? (
                        <Image
                          src={posterSrc}
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
              </div>
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
