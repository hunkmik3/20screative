"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const MIN_BUFFER_SECONDS = 8;
const MIN_DISPLAY_MS = 1200;
const MAX_WAIT_MS = 15000;

export default function HomeHero({ videoSrc }: { videoSrc?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(!videoSrc);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!videoSrc) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const startedAt = Date.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        setIsReady(true);
        video.play().catch(() => {});
      }, remaining);
    };

    const checkBuffer = () => {
      if (video.buffered.length === 0) return;
      const buffered = video.buffered.end(0);
      const ratio = Math.min(buffered / MIN_BUFFER_SECONDS, 1);
      setProgress(ratio);
      if (buffered >= MIN_BUFFER_SECONDS || video.readyState >= 4) {
        finish();
      }
    };

    video.addEventListener("progress", checkBuffer);
    video.addEventListener("loadeddata", checkBuffer);
    video.addEventListener("canplaythrough", finish);

    const maxTimer = setTimeout(finish, MAX_WAIT_MS);

    return () => {
      video.removeEventListener("progress", checkBuffer);
      video.removeEventListener("loadeddata", checkBuffer);
      video.removeEventListener("canplaythrough", finish);
      clearTimeout(maxTimer);
    };
  }, [videoSrc]);

  return (
    <>
      <div
        className={`${styles.loadingOverlay} ${isReady ? styles.loadingHidden : ""}`}
        aria-hidden={isReady}
      >
        <div className={styles.loadingContent}>
          <h1 className={styles.loadingLogo}>20sCREATIVE</h1>
          <div className={styles.loadingBarTrack}>
            <div
              className={styles.loadingBarFill}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className={styles.loadingText}>Loading showreel…</p>
        </div>
      </div>

      <div className={styles.hero}>
        <div className={styles.videoContainer}>
          {videoSrc ? (
            <video
              ref={videoRef}
              className={styles.heroVideo}
              src={videoSrc}
              muted
              loop
              playsInline
              preload="auto"
            />
          ) : (
            <iframe
              className={styles.heroVideo}
              src="https://www.youtube.com/embed/ZydWWTTWuO8?autoplay=1&mute=1&loop=1&playlist=ZydWWTTWuO8&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&start=1"
              title="20sCreative Showreel"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className={styles.fallbackBg} />
        <div className={styles.overlay} />
      </div>
    </>
  );
}
