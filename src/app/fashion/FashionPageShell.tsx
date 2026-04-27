"use client";
import { useEffect, useRef, useState } from "react";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import FashionEditorialPage from "@/components/FashionEditorialPage";
import type { FashionPageContent } from "@/data/fashionPage";
import styles from "./FashionPageShell.module.css";

const MIN_BUFFER_SECONDS = 4;
const MIN_DISPLAY_MS = 700;
const MAX_WAIT_MS = 12000;

export default function FashionPageShell({
  content,
}: {
  content: FashionPageContent;
}) {
  const heroBlock = content.blocks.find((block) => block.type === "hero");
  const heroVideoUrl =
    heroBlock?.mediaKind === "video" && heroBlock?.mediaUrl
      ? heroBlock.mediaUrl
      : undefined;

  const [isReady, setIsReady] = useState<boolean>(!heroVideoUrl);
  const [showOverlay, setShowOverlay] = useState(Boolean(heroVideoUrl));
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!heroVideoUrl) return;
    const video = videoRef.current;
    if (!video) return;

    const startedAt = Date.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      window.setTimeout(() => setIsReady(true), remaining);
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

    const maxTimer = window.setTimeout(finish, MAX_WAIT_MS);

    return () => {
      video.removeEventListener("progress", checkBuffer);
      video.removeEventListener("loadeddata", checkBuffer);
      video.removeEventListener("canplaythrough", finish);
      window.clearTimeout(maxTimer);
    };
  }, [heroVideoUrl]);

  // Lock body scroll while loading
  useEffect(() => {
    if (isReady) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isReady]);

  return (
    <>
      {heroVideoUrl && (
        <video
          ref={videoRef}
          src={heroVideoUrl}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className={styles.bufferProbe}
        />
      )}

      {heroVideoUrl && showOverlay && (
        <BrandLoadingOverlay
          progress={progress}
          exiting={isReady}
          text="Loading..."
          onExited={() => setShowOverlay(false)}
        />
      )}

      <FashionEditorialPage content={content} />
    </>
  );
}
