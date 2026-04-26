"use client";

import { useState, useRef } from "react";
import styles from "./VideoPlayer.module.css";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    className?: string;
}

export default function VideoPlayer({
    src,
    poster,
    title,
    autoPlay = false,
    muted = true,
    loop = true,
    controls = true,
    className = "",
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(muted);
    const cleanSrc = src.trim();
    const cleanPoster = poster?.trim();

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className={`${styles.container} ${className}`}>
            {title && <h2 className={styles.title}>{title}</h2>}
            <div className={styles.videoWrapper}>
                {cleanSrc ? (
                    <video
                        ref={videoRef}
                        className={styles.video}
                        src={cleanSrc}
                        poster={cleanPoster || undefined}
                        autoPlay={autoPlay}
                        muted={muted}
                        loop={loop}
                        playsInline
                        controls={controls}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                ) : (
                    <div className={styles.placeholder}>No video</div>
                )}
                {cleanSrc && !controls && (
                    <div className={styles.customControls}>
                        <button
                            className={styles.controlButton}
                            onClick={togglePlay}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" />
                                    <rect x="14" y="4" width="4" height="16" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                            )}
                        </button>
                        <button
                            className={styles.controlButton}
                            onClick={toggleMute}
                            aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
