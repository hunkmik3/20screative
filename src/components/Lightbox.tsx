"use client";

import { useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import styles from "./Lightbox.module.css";
import type { GalleryImage } from "./Gallery";

interface LightboxProps {
    images: GalleryImage[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onPrevious: () => void;
    onNext: () => void;
}

export default function Lightbox({
    images,
    currentIndex,
    isOpen,
    onClose,
    onPrevious,
    onNext,
}: LightboxProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowLeft":
                    onPrevious();
                    break;
                case "ArrowRight":
                    onNext();
                    break;
            }
        },
        [isOpen, onClose, onPrevious, onNext]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div
            ref={containerRef}
            className={styles.lightbox}
            onClick={(e) => {
                if (e.target === containerRef.current) {
                    onClose();
                }
            }}
        >
            {/* Close Button */}
            <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close lightbox"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Previous Button */}
            {images.length > 1 && (
                <button
                    className={`${styles.navButton} ${styles.prevButton}`}
                    onClick={onPrevious}
                    aria-label="Previous image"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                    >
                        <polyline points="15,18 9,12 15,6" />
                    </svg>
                </button>
            )}

            {/* Image */}
            <div className={styles.imageContainer}>
                <Image
                    src={currentImage.src}
                    alt={currentImage.alt}
                    width={currentImage.width}
                    height={currentImage.height}
                    className={styles.image}
                    priority
                />
            </div>

            {/* Next Button */}
            {images.length > 1 && (
                <button
                    className={`${styles.navButton} ${styles.nextButton}`}
                    onClick={onNext}
                    aria-label="Next image"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                    >
                        <polyline points="9,6 15,12 9,18" />
                    </svg>
                </button>
            )}

            {/* Counter */}
            <div className={styles.counter}>
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    );
}
