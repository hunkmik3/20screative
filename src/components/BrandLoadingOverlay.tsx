"use client";

import Image from "next/image";
import styles from "./BrandLoadingOverlay.module.css";

interface BrandLoadingOverlayProps {
  progress?: number;
  exiting?: boolean;
  text?: string;
  onExited?: () => void;
}

export default function BrandLoadingOverlay({
  progress = 0,
  exiting = false,
  text = "Loading...",
  onExited,
}: BrandLoadingOverlayProps) {
  const safeProgress = Math.max(0, Math.min(1, progress));

  return (
    <div
      className={`${styles.overlay} ${exiting ? styles.overlayExit : ""}`}
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.currentTarget !== event.target || !exiting) return;
        onExited?.();
      }}
    >
      <div className={`${styles.content} ${exiting ? styles.contentExit : ""}`}>
        <div className={styles.logoStage}>
          <Image
            src="/logo-white.png"
            alt="20sCreative"
            width={240}
            height={240}
            className={styles.logo}
            priority
          />
        </div>
        <p className={styles.tagline}>Creative Production</p>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ width: `${Math.round(safeProgress * 100)}%` }}
          />
        </div>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
}
