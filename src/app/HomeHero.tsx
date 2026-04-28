"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function HomeHero({ videoSrc }: { videoSrc?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoSrc) return;
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const play = () => {
      if (!active || document.hidden) return;
      void video.play().catch(() => {});
    };
    const handleVisibility = () => {
      if (document.hidden) video.pause();
      else play();
    };

    video.addEventListener("loadeddata", play);
    video.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", handleVisibility);
    play();

    return () => {
      active = false;
      video.removeEventListener("loadeddata", play);
      video.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [videoSrc]);

  return (
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
            autoPlay
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
  );
}
