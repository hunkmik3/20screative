"use client";

import styles from "./page.module.css";

export default function HomeHero({ videoSrc }: { videoSrc?: string }) {
  return (
    <div className={styles.hero}>
      <div className={styles.videoContainer}>
        {videoSrc ? (
          <video
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
