"use client";
import { useEffect, useRef, useState } from "react";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import FashionEditorialPage from "@/components/FashionEditorialPage";
import type { FashionPageContent } from "@/data/fashionPage";
import styles from "./FashionPageShell.module.css";

const MIN_BUFFER_SECONDS = 4;
const MIN_DISPLAY_MS = 700;
const MAX_WAIT_MS = 12000;
const MOBILE_MAX_WAIT_MS = 1600;

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
  const [shouldProbeVideo, setShouldProbeVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!heroVideoUrl) return;
    const isMobileLike =
      window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;

    if (isMobileLike) {
      const startedAt = Date.now();
      const progressTimer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        setProgress(Math.min(1, elapsed / MOBILE_MAX_WAIT_MS));
      }, 120);
      const timer = window.setTimeout(() => {
        setProgress(1);
        setIsReady(true);
      }, MOBILE_MAX_WAIT_MS);

      return () => {
        window.clearInterval(progressTimer);
        window.clearTimeout(timer);
      };
    }

    const frame = window.requestAnimationFrame(() => {
      setShouldProbeVideo(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [heroVideoUrl]);

  useEffect(() => {
    if (!heroVideoUrl || !shouldProbeVideo) return;
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
      if (video.readyState >= 2) {
        setProgress((current) => Math.max(current, 0.7));
      }
      if (video.buffered.length === 0) {
        if (video.readyState >= 3) finish();
        return;
      }
      const buffered = video.buffered.end(0);
      const ratio = Math.min(buffered / MIN_BUFFER_SECONDS, 1);
      setProgress(ratio);
      if (buffered >= MIN_BUFFER_SECONDS || video.readyState >= 4) {
        finish();
      }
    };

    video.addEventListener("progress", checkBuffer);
    video.addEventListener("loadeddata", checkBuffer);
    video.addEventListener("loadedmetadata", checkBuffer);
    video.addEventListener("canplay", finish);
    video.addEventListener("canplaythrough", finish);
    video.addEventListener("error", finish);

    video.load();

    const maxTimer = window.setTimeout(finish, MAX_WAIT_MS);

    return () => {
      video.removeEventListener("progress", checkBuffer);
      video.removeEventListener("loadeddata", checkBuffer);
      video.removeEventListener("loadedmetadata", checkBuffer);
      video.removeEventListener("canplay", finish);
      video.removeEventListener("canplaythrough", finish);
      video.removeEventListener("error", finish);
      window.clearTimeout(maxTimer);
    };
  }, [heroVideoUrl, shouldProbeVideo]);

  // Lock body scroll while loading
  useEffect(() => {
    if (isReady) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !showOverlay) return;
    const timer = window.setTimeout(() => setShowOverlay(false), 900);
    return () => window.clearTimeout(timer);
  }, [isReady, showOverlay]);

  return (
    <>
      {heroVideoUrl && shouldProbeVideo && (
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
