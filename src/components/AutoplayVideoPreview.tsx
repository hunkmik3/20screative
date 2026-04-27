"use client";

import { useEffect, useRef, useState } from "react";

interface AutoplayVideoPreviewProps {
  src: string;
  className: string;
  fallbackSrc?: string;
  posterUrl?: string;
  preload?: "none" | "metadata" | "auto";
  startDelayMs?: number;
}

export default function AutoplayVideoPreview({
  src,
  className,
  fallbackSrc,
  posterUrl,
  preload = "auto",
  startDelayMs = 0,
}: AutoplayVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanSrc = src.trim();
  const cleanFallbackSrc = fallbackSrc?.trim();
  const cleanPosterUrl = posterUrl?.trim();
  const [activeSrc, setActiveSrc] = useState(cleanSrc);

  useEffect(() => {
    setActiveSrc(cleanSrc);
  }, [cleanSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    let active = true;
    let playTimer: number | null = null;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const play = () => {
      if (!active || document.hidden) return;
      if (playTimer !== null) window.clearTimeout(playTimer);
      playTimer = window.setTimeout(() => {
        if (!active || document.hidden) return;
        void video.play().catch(() => {});
      }, startDelayMs);
    };

    const pause = () => {
      if (playTimer !== null) {
        window.clearTimeout(playTimer);
        playTimer = null;
      }
      video.pause();
    };

    const handleVisibility = () => {
      if (document.hidden) pause();
      else play();
    };

    video.addEventListener("loadeddata", play);
    video.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", handleVisibility);

    if (typeof IntersectionObserver === "undefined") {
      play();
      return () => {
        active = false;
        if (playTimer !== null) window.clearTimeout(playTimer);
        video.removeEventListener("loadeddata", play);
        video.removeEventListener("canplay", play);
        document.removeEventListener("visibilitychange", handleVisibility);
        pause();
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) play();
        else pause();
      },
      { threshold: [0, 0.2, 0.6] },
    );

    observer.observe(video);
    play();

    return () => {
      active = false;
      observer.disconnect();
      if (playTimer !== null) window.clearTimeout(playTimer);
      video.removeEventListener("loadeddata", play);
      video.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", handleVisibility);
      pause();
    };
  }, [activeSrc, startDelayMs]);

  if (!activeSrc) return null;

  return (
    <video
      ref={videoRef}
      className={className}
      src={activeSrc}
      poster={cleanPosterUrl || undefined}
      autoPlay
      muted
      loop
      playsInline
      preload={preload}
      disablePictureInPicture
      aria-hidden="true"
      onError={() => {
        if (cleanFallbackSrc && activeSrc !== cleanFallbackSrc) {
          setActiveSrc(cleanFallbackSrc);
        }
      }}
    />
  );
}
