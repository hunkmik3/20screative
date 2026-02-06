"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import styles from "./Gallery.module.css";
import Lightbox from "./Lightbox";

export interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    width: number;
    height: number;
}

interface GalleryProps {
    images: GalleryImage[];
    columns?: 2 | 3 | 4;
}

export default function Gallery({ images, columns = 3 }: GalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = useCallback((index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
    }, []);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    return (
        <>
            <div
                className={styles.grid}
                style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                }}
            >
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className={styles.item}
                        onClick={() => openLightbox(index)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                openLightbox(index);
                            }
                        }}
                    >
                        <Image
                            src={image.src}
                            alt={image.alt}
                            width={image.width}
                            height={image.height}
                            className={styles.image}
                            loading={index < 6 ? "eager" : "lazy"}
                        />
                        <div className={styles.overlay}>
                            <span className={styles.viewText}>View</span>
                        </div>
                    </div>
                ))}
            </div>

            <Lightbox
                images={images}
                currentIndex={currentIndex}
                isOpen={lightboxOpen}
                onClose={closeLightbox}
                onPrevious={goToPrevious}
                onNext={goToNext}
            />
        </>
    );
}
