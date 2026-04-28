"use client";

import { useEffect } from "react";
import CloudflareStreamPlayer from "@/components/CloudflareStreamPlayer";
import { hasCloudflareStreamConfig } from "@/lib/cloudflareStream";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/videoEmbed";
import styles from "./VideoPopup.module.css";

interface VideoPopupProps {
    isOpen: boolean;
    title: string;
    videoUrl: string;
    streamUid?: string | null;
    onClose: () => void;
    fullscreen?: boolean;
}

export default function VideoPopup({
    isOpen,
    title,
    videoUrl,
    streamUid,
    onClose,
    fullscreen = false,
}: VideoPopupProps) {
    useEffect(() => {
        if (!isOpen || (!streamUid?.trim() && !videoUrl.trim())) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen, onClose, streamUid, videoUrl]);

    const cleanStreamUid = streamUid?.trim() ?? "";
    const cleanVideoUrl = videoUrl.trim();
    const canUseStream = Boolean(cleanStreamUid && hasCloudflareStreamConfig());

    if (!isOpen || (!cleanStreamUid && !cleanVideoUrl)) return null;

    const youtube = isYoutubeUrl(cleanVideoUrl);
    const src = youtube
        ? (toYoutubeEmbedUrl(cleanVideoUrl, {
              autoplay: true,
              controls: true,
          }) ?? cleanVideoUrl)
        : cleanVideoUrl;

    return (
        <div
            className={`${styles.overlay} ${fullscreen ? styles.fullscreenOverlay : ""}`}
            onClick={onClose}
            role="presentation"
        >
            <div
                className={`${styles.modal} ${fullscreen ? styles.fullscreenModal : ""}`}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close video popup"
                >
                    &times;
                </button>

                {!fullscreen && <p className={styles.title}>{title}</p>}

                <div className={`${styles.player} ${fullscreen ? styles.fullscreenPlayer : ""}`}>
                    {canUseStream ? (
                        <CloudflareStreamPlayer
                            streamUid={cleanStreamUid}
                            title={title || "Video"}
                            className={styles.iframe}
                            autoplay
                            controls
                            preload="auto"
                            loading="eager"
                        />
                    ) : youtube ? (
                        <iframe
                            className={styles.iframe}
                            src={src}
                            title={title || "Video"}
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <video className={styles.video} src={src} controls autoPlay playsInline />
                    )}
                </div>
            </div>
        </div>
    );
}
