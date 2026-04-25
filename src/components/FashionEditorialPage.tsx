"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import VideoPopup from "@/components/VideoPopup";
import type {
  FashionBlock,
  FashionMediaItem,
  FashionPageContent,
} from "@/data/fashionPage";
import styles from "./FashionEditorialPage.module.css";

type ActiveVideo = {
  title: string;
  url: string;
};

interface FashionEditorialPageProps {
  content: FashionPageContent;
}

function mediaClassFor(aspect?: FashionMediaItem["aspect"]) {
  if (aspect === "landscape") return styles.landscapeMedia;
  if (aspect === "square") return styles.squareMedia;
  return styles.portraitMedia;
}

function MediaFrame({
  mediaUrl,
  mediaKind = "image",
  posterUrl,
  title,
  className = "",
}: {
  mediaUrl?: string;
  mediaKind?: "image" | "video";
  posterUrl?: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={`${styles.mediaFrame} ${className}`}>
      {mediaUrl ? (
        mediaKind === "video" ? (
          <video
            className={styles.media}
            src={mediaUrl}
            poster={posterUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img className={styles.media} src={mediaUrl} alt={title} />
        )
      ) : (
        <div className={styles.mediaPlaceholder}>{title}</div>
      )}
    </div>
  );
}

function PlayButton({
  label = "View film",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={styles.playButton} onClick={onClick}>
      <span className={styles.playIcon} aria-hidden="true" />
      {label}
    </button>
  );
}

const itemVariantClasses = {
  carousel: "",
  grid: "",
  pair: "",
};

export default function FashionEditorialPage({
  content,
}: FashionEditorialPageProps) {
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [activeSlides, setActiveSlides] = useState<Record<string, number>>({});

  const blocks = useMemo(
    () => content.blocks.filter((block) => block.title.trim()),
    [content.blocks],
  );

  const openVideo = (title: string, url?: string) => {
    if (!url) return;
    setActiveVideo({ title, url });
  };

  const setSlide = (block: FashionBlock, nextIndex: number) => {
    const count = block.items?.length ?? 0;
    if (count === 0) return;
    const safeIndex = (nextIndex + count) % count;
    setActiveSlides((current) => ({ ...current, [block.id]: safeIndex }));
  };

  const renderItemCard = (
    item: FashionMediaItem,
    index: number,
    variant: "carousel" | "grid" | "pair",
  ) => {
    const card = (
      <>
        <MediaFrame
          mediaUrl={item.mediaUrl}
          mediaKind={item.mediaKind}
          posterUrl={item.posterUrl}
          title={item.title}
          className={mediaClassFor(item.aspect)}
        />
        <div className={styles.itemCopy}>
          <span className={styles.itemNumber}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3>{item.title}</h3>
          {item.subtitle && <p>{item.subtitle}</p>}
        </div>
        {item.videoUrl && <span className={styles.inlinePlay}>View film</span>}
      </>
    );

    const variantClass =
      variant === "carousel"
        ? itemVariantClasses.carousel
        : variant === "grid"
          ? itemVariantClasses.grid
          : itemVariantClasses.pair;
    const className = `${styles.itemCard} ${variantClass}`;

    if (item.videoUrl) {
      return (
        <button
          key={item.id}
          type="button"
          className={className}
          onClick={() => openVideo(item.title, item.videoUrl)}
        >
          {card}
        </button>
      );
    }

    if (item.href) {
      return (
        <a key={item.id} className={className} href={item.href}>
          {card}
        </a>
      );
    }

    return (
      <article key={item.id} className={className}>
        {card}
      </article>
    );
  };

  const renderBlock = (block: FashionBlock) => {
    if (block.type === "hero") {
      return (
        <section key={block.id} className={styles.hero}>
          <MediaFrame
            mediaUrl={block.mediaUrl}
            mediaKind={block.mediaKind}
            posterUrl={block.posterUrl}
            title={block.title}
            className={styles.heroMedia}
          />
          <div className={styles.heroShade} />
          <div className={styles.heroCopy}>
            {block.kicker && <p className={styles.kicker}>{block.kicker}</p>}
            <h1>{block.title}</h1>
            {block.subtitle && <p>{block.subtitle}</p>}
            <div className={styles.actionRow}>
              {block.videoUrl && (
                <PlayButton
                  label="Xem video"
                  onClick={() => openVideo(block.title, block.videoUrl)}
                />
              )}
              {!block.videoUrl && block.ctaLabel && block.ctaHref && (
                <a className={styles.textLink} href={block.ctaHref}>
                  {block.ctaLabel}
                </a>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "statement") {
      return (
        <section key={block.id} className={styles.statement}>
          {block.kicker && <p className={styles.kicker}>{block.kicker}</p>}
          <h2>{block.title}</h2>
          {block.body && <p>{block.body}</p>}
        </section>
      );
    }

    if (block.type === "feature") {
      return (
        <section key={block.id} className={styles.feature}>
          <MediaFrame
            mediaUrl={block.mediaUrl}
            mediaKind={block.mediaKind}
            posterUrl={block.posterUrl}
            title={block.title}
            className={styles.featureMedia}
          />
          <div className={styles.featureCopy}>
            {block.kicker && <p className={styles.kicker}>{block.kicker}</p>}
            <h2>{block.title}</h2>
            {block.subtitle && <p className={styles.lede}>{block.subtitle}</p>}
            {block.body && <p>{block.body}</p>}
            {block.videoUrl && (
              <PlayButton
                label={block.ctaLabel ?? "View film"}
                onClick={() => openVideo(block.title, block.videoUrl)}
              />
            )}
            {!block.videoUrl && block.ctaLabel && block.ctaHref && (
              <a className={styles.textLinkDark} href={block.ctaHref}>
                {block.ctaLabel}
              </a>
            )}
          </div>
        </section>
      );
    }

    if (block.type === "mediaPair") {
      return (
        <section key={block.id} className={styles.blockShell}>
          <div className={styles.sectionHeader}>
            <h2>{block.title}</h2>
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
          <div className={styles.mediaPair}>
            {(block.items ?? []).map((item, index) =>
              renderItemCard(item, index, "pair"),
            )}
          </div>
        </section>
      );
    }

    if (block.type === "carousel") {
      const items = block.items ?? [];
      const activeIndex = activeSlides[block.id] ?? 0;

      return (
        <section key={block.id} className={styles.blockShell}>
          <div className={styles.sectionHeader}>
            {block.kicker && <p className={styles.kicker}>{block.kicker}</p>}
            <h2>{block.title}</h2>
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
          <div className={styles.carousel}>
            <div
              className={styles.carouselTrack}
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {items.map((item, index) => (
                <div key={item.id} className={styles.carouselSlide}>
                  {renderItemCard(item, index, "carousel")}
                </div>
              ))}
            </div>
            {items.length > 1 && (
              <div className={styles.carouselControls}>
                <button
                  type="button"
                  onClick={() => setSlide(block, activeIndex - 1)}
                  aria-label="Previous slide"
                >
                  Prev
                </button>
                <div className={styles.dots}>
                  {items.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={index === activeIndex ? styles.dotActive : ""}
                      onClick={() => setSlide(block, index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSlide(block, activeIndex + 1)}
                  aria-label="Next slide"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      );
    }

    if (block.type === "projectGrid") {
      return (
        <section key={block.id} id={block.id} className={styles.blockShell}>
          <div className={styles.sectionHeader}>
            {block.kicker && <p className={styles.kicker}>{block.kicker}</p>}
            <h2>{block.title}</h2>
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
          <div className={styles.projectGrid}>
            {(block.items ?? []).map((item, index) =>
              renderItemCard(item, index, "grid"),
            )}
          </div>
        </section>
      );
    }

    if (block.type === "reviews") {
      return (
        <section key={block.id} className={styles.reviewsSection}>
          <div className={styles.sectionHeader}>
            {block.kicker && <p className={styles.kicker}>{block.kicker}</p>}
            <h2>{block.title}</h2>
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
          <div className={styles.reviewGrid}>
            {(block.items ?? []).map((item, index) => (
              <article key={item.id} className={styles.reviewCard}>
                <span className={styles.itemNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.subtitle && <blockquote>{item.subtitle}</blockquote>}
                <footer>
                  <strong>{item.title}</strong>
                  {item.meta && <span>{item.meta}</span>}
                </footer>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (block.type === "cta") {
      return (
        <section key={block.id} className={styles.ctaBlock}>
          <MediaFrame
            mediaUrl={block.mediaUrl}
            mediaKind={block.mediaKind}
            posterUrl={block.posterUrl}
            title={block.title}
            className={styles.ctaMedia}
          />
          <div className={styles.ctaCopy}>
            <h2>{block.title}</h2>
            {block.subtitle && <p>{block.subtitle}</p>}
            {block.ctaLabel && block.ctaHref && (
              <a href={block.ctaHref}>{block.ctaLabel}</a>
            )}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className={styles.page}>
      {blocks.map(renderBlock)}
      <VideoPopup
        isOpen={Boolean(activeVideo)}
        title={activeVideo?.title ?? ""}
        videoUrl={activeVideo?.url ?? ""}
        onClose={() => setActiveVideo(null)}
        fullscreen
      />
    </div>
  );
}
