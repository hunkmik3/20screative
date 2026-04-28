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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const selectedSrc =
    failedSrc === cleanSrc && cleanFallbackSrc ? cleanFallbackSrc : cleanSrc;
  const activeSrc = shouldLoad ? selectedSrc : "";
  const isReady = Boolean(activeSrc && readySrc === activeSrc);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedSrc) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setShouldLoad(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setShouldLoad(true);
        }
      },
      { rootMargin: "520px 0px", threshold: 0 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [selectedSrc]);

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
        void video.play().catch(() => {
          setReadySrc(null);
        });
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

  if (!selectedSrc) return null;

  return (
    <>
      <video
        ref={videoRef}
        className={className}
        src={activeSrc || undefined}
        poster={cleanPosterUrl || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload={activeSrc ? preload : "none"}
        disablePictureInPicture
        aria-hidden="true"
        onError={() => {
          if (cleanFallbackSrc && activeSrc && activeSrc !== cleanFallbackSrc) {
            setFailedSrc(activeSrc);
          }
        }}
        onCanPlay={() => setReadySrc(activeSrc)}
        onLoadedData={() => setReadySrc(activeSrc)}
        onPlaying={() => setReadySrc(activeSrc)}
        style={{
          opacity: isReady ? 1 : 0,
          transition: "opacity 180ms ease",
        }}
      />
      {cleanPosterUrl && !isReady && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={className}
          src={cleanPosterUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}
