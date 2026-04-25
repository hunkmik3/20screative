"use client";

import { useEffect } from "react";
import styles from "./VideoPopup.module.css";

interface VideoPopupProps {
    isOpen: boolean;
    title: string;
    videoUrl: string;
    onClose: () => void;
    fullscreen?: boolean;
}

const isYoutubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
};

const buildYoutubeEmbedUrl = (videoId: string) => {
    const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    embedUrl.searchParams.set("autoplay", "1");
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("modestbranding", "1");
    embedUrl.searchParams.set("iv_load_policy", "3");
    embedUrl.searchParams.set("playsinline", "1");
    return embedUrl.toString();
};

const toEmbedUrl = (url: string) => {
    try {
        const parsed = new URL(url);

        if (parsed.hostname.includes("youtu.be")) {
            const videoId = parsed.pathname.replace("/", "");
            return videoId ? buildYoutubeEmbedUrl(videoId) : url;
        }

        if (parsed.pathname.includes("/embed/")) {
            const videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0];
            return videoId ? buildYoutubeEmbedUrl(videoId) : url;
        }

        if (parsed.pathname.includes("/watch")) {
            const videoId = parsed.searchParams.get("v");
            return videoId ? buildYoutubeEmbedUrl(videoId) : url;
        }
    } catch {
        return url;
    }

    return url;
};

export default function VideoPopup({
    isOpen,
    title,
    videoUrl,
    onClose,
    fullscreen = false,
}: VideoPopupProps) {
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const youtube = isYoutubeUrl(videoUrl);
    const src = youtube ? toEmbedUrl(videoUrl) : videoUrl;

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
                    {youtube ? (
                        <iframe
                            className={styles.iframe}
                            src={src}
                            title={title}
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
