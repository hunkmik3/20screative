"use client";

/* eslint-disable @next/next/no-img-element */
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent as ReactTouchEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import AutoplayVideoPreview from "@/components/AutoplayVideoPreview";
import DragResizeFrame from "@/components/DragResizeFrame";
import RevealText from "@/components/RevealText";
import VideoPopup from "@/components/VideoPopup";
import { useScrollFadeIn } from "@/components/useScrollFadeIn";
import type {
  FashionBlock,
  FashionLayout,
  FashionMediaItem,
  FashionPageContent,
} from "@/data/fashionPage";
import {
  getCloudflareStreamDownloadUrl,
  getCloudflareStreamThumbnailUrl,
  hasCloudflareStreamConfig,
} from "@/lib/cloudflareStream";
import { resolveLayoutStyle } from "@/lib/fashionLayoutStyle";
import styles from "./FashionEditorialPage.module.css";

export type FashionLayoutKey = "layout" | "mediaLayout" | "textLayout";

type ActiveVideo = {
  title: string;
  url?: string;
  streamUid?: string;
};

interface FashionEditorialPageProps {
  content: FashionPageContent;
  editorMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  selectedSubTarget?: string | null;
  onSelectSubTarget?: (target: string | null) => void;
  onUpdateBlockLayout?: (
    blockId: string,
    key: FashionLayoutKey,
    next: FashionLayout,
  ) => void;
  onUpdateItemLayout?: (
    blockId: string,
    itemId: string,
    key: "layout" | "mediaLayout",
    next: FashionLayout,
  ) => void;
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
  streamUid,
  title,
  className = "",
  autoplay = true,
  preload = "metadata",
}: {
  mediaUrl?: string;
  mediaKind?: "image" | "video";
  posterUrl?: string;
  streamUid?: string;
  title: string;
  className?: string;
  autoplay?: boolean;
  preload?: "none" | "metadata" | "auto";
}) {
  const cleanMediaUrl = mediaUrl?.trim();
  const cleanStreamUid = streamUid?.trim();
  const canUseStream =
    mediaKind === "video" &&
    Boolean(cleanStreamUid) &&
    hasCloudflareStreamConfig();
  const streamVideoUrl = getCloudflareStreamDownloadUrl(cleanStreamUid);
  const streamPosterUrl = getCloudflareStreamThumbnailUrl(cleanStreamUid);
  const cleanPosterUrl = posterUrl?.trim() || streamPosterUrl?.trim();
  const previewVideoUrl = canUseStream ? streamVideoUrl : cleanMediaUrl;

  return (
    <div className={`${styles.mediaFrame} ${className}`}>
      {mediaKind === "video" && previewVideoUrl ? (
        autoplay ? (
          <AutoplayVideoPreview
            src={previewVideoUrl}
            fallbackSrc={canUseStream ? cleanMediaUrl : undefined}
            posterUrl={cleanPosterUrl || undefined}
            className={styles.media}
            preload="auto"
          />
        ) : (
          <video
            className={styles.media}
            src={previewVideoUrl}
            poster={cleanPosterUrl || undefined}
            muted
            loop
            playsInline
            preload={preload}
            disablePictureInPicture
          />
        )
      ) : cleanMediaUrl ? (
        <img className={styles.media} src={cleanMediaUrl} alt={title} />
      ) : cleanPosterUrl ? (
        <img className={styles.media} src={cleanPosterUrl} alt={title} />
      ) : (
        <div className={styles.mediaPlaceholder}>{title}</div>
      )}
    </div>
  );
}

function PlayButton({
  label = "View film",
  variant = "default",
  onClick,
}: {
  label?: string;
  variant?: "default" | "circle" | "ghost";
  onClick: () => void;
}) {
  const cls =
    variant === "circle"
      ? `${styles.playButton} ${styles.playButtonCircle}`
      : variant === "ghost"
        ? `${styles.playButton} ${styles.playButtonGhost}`
        : styles.playButton;
  return (
    <button type="button" className={cls} onClick={onClick}>
      <span className={styles.playIcon} aria-hidden="true" />
      <span className={styles.playButtonTextWrap}>
        <span className={styles.playButtonText}>{label}</span>
        <span className={styles.playButtonTextClone} aria-hidden="true">
          {label}
        </span>
      </span>
    </button>
  );
}

type FadeVariant = "up" | "down" | "left" | "right" | "scale" | "fade";

function FadeIn({
  children,
  className = "",
  delay = 0,
  variant = "up",
  duration,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: FadeVariant;
  duration?: number;
}) {
  const { ref, visible } = useScrollFadeIn<HTMLDivElement>();
  const style: CSSProperties = {};
  if (delay) style.transitionDelay = `${delay}ms`;
  if (duration) style.transitionDuration = `${duration}ms`;

  const variantClass =
    variant === "down"
      ? styles.fadeInDown
      : variant === "left"
        ? styles.fadeInLeft
        : variant === "right"
          ? styles.fadeInRight
          : variant === "scale"
            ? styles.fadeInScale
            : variant === "fade"
              ? styles.fadeInPlain
              : styles.fadeInUp;

  return (
    <div
      ref={ref}
      className={`${styles.fadeIn} ${variantClass} ${visible ? styles.fadeInVisible : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function themeClass(theme?: FashionBlock["theme"]) {
  if (theme === "dark") return styles.themeDark;
  if (theme === "warm") return styles.themeWarm;
  return styles.themeLight;
}

function spacerClass(size?: FashionBlock["spacerSize"]) {
  if (size === "sm") return styles.spacerSm;
  if (size === "lg") return styles.spacerLg;
  if (size === "xl") return styles.spacerXl;
  return styles.spacerMd;
}

function alignClass(align?: FashionBlock["align"]) {
  if (align === "left") return styles.alignLeft;
  if (align === "right") return styles.alignRight;
  return styles.alignCenter;
}

function reviewGridClassFor(count: number) {
  if (count <= 1) return styles.reviewGrid1Cols;
  if (count === 2) return styles.reviewGrid2Cols;
  if (count >= 4) return styles.reviewGrid4Cols;
  return styles.reviewGrid3Cols;
}

function LookbookSection({
  block,
  activeIndex,
  editorMode,
  variant = "portrait",
  onSetIndex,
  onPlayVideo,
  renderItem,
}: {
  block: FashionBlock;
  activeIndex: number;
  editorMode: boolean;
  variant?: "portrait" | "landscape";
  onSetIndex: (index: number) => void;
  onPlayVideo: (title: string, url?: string, streamUid?: string) => void;
  renderItem: (
    item: FashionMediaItem,
    index: number,
    variant:
      | "carousel"
      | "grid"
      | "pair"
      | "lookbook"
      | "lookbookLandscape"
      | "world",
  ) => ReactNode;
}) {
  const items = block.items ?? [];
  const N = items.length;
  const showPeek = block.showPeek !== false;
  const isLandscape = variant === "landscape";
  const useLoop = N > 1;

  // Border-clone array: [last, ...items, first] for circular peek
  const expandedItems = useLoop ? [items[N - 1], ...items, items[0]] : items;

  // displayIndex lives in expandedItems space (0..N+1 when looping)
  const [displayIndex, setDisplayIndex] = useState<number>(() =>
    useLoop ? activeIndex + 1 : activeIndex,
  );
  const [animate, setAnimate] = useState(true);
  const [autoplayStopped, setAutoplayStopped] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [trackTranslatePx, setTrackTranslatePx] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastSyncedActiveRef = useRef(activeIndex);
  const wheelRemainderRef = useRef(0);
  const lastWheelStepAtRef = useRef(0);
  const lastSwipeStepAtRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchDeltaXRef = useRef(0);
  const touchGestureRef = useRef<"none" | "horizontal" | "vertical">("none");
  const suppressClickUntilRef = useRef(0);

  // Sync external activeIndex → displayIndex (e.g. autoplay tick from outside,
  // or other code paths setting active). Only when value actually differs.
  useEffect(() => {
    if (lastSyncedActiveRef.current === activeIndex) return;
    lastSyncedActiveRef.current = activeIndex;
    const frame = window.requestAnimationFrame(() => {
      setAnimate(true);
      setDisplayIndex(useLoop ? activeIndex + 1 : activeIndex);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, useLoop]);

  // Autoplay 3s per slide — re-armed on every displayIndex change so the
  // boundary snap (clone → real) doesn't shorten the first slide's duration.
  // Off only in editor mode.
  useEffect(() => {
    if (N < 2 || editorMode || autoplayStopped) return;
    const timer = window.setTimeout(() => {
      setAnimate(true);
      setDisplayIndex((prev) => prev + 1);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [N, editorMode, displayIndex, autoplayStopped]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const slide = track?.children[displayIndex] as HTMLElement | undefined;
    if (!viewport || !track || !slide) return;

    const updatePosition = () => {
      const nextTranslate =
        viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
      setTrackTranslatePx((current) =>
        Math.abs(current - nextTranslate) < 0.5 ? current : nextTranslate,
      );
    };

    updatePosition();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    }

    const observer = new ResizeObserver(updatePosition);
    observer.observe(viewport);
    observer.observe(track);
    observer.observe(slide);
    return () => observer.disconnect();
  }, [displayIndex, expandedItems.length, isLandscape, showPeek]);

  useEffect(() => {
    return () => {
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
    };
  }, []);

  const sectionClass = isLandscape ? styles.lookbookLandscape : styles.lookbook;
  const slideClass = isLandscape
    ? styles.lookbookSlideLandscape
    : styles.lookbookSlide;
  const itemVariant: "lookbook" | "lookbookLandscape" = isLandscape
    ? "lookbookLandscape"
    : "lookbook";

  // Snap from clone position to its real twin without animation
  const snapAfterTransition = () => {
    if (!useLoop) return;
    if (displayIndex === 0) {
      setAnimate(false);
      setDisplayIndex(N);
      lastSyncedActiveRef.current = N - 1;
      onSetIndex(N - 1);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimate(true)),
      );
    } else if (displayIndex === N + 1) {
      setAnimate(false);
      setDisplayIndex(1);
      lastSyncedActiveRef.current = 0;
      onSetIndex(0);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimate(true)),
      );
    } else {
      const realIdx = displayIndex - 1;
      if (realIdx !== activeIndex && realIdx >= 0 && realIdx < N) {
        lastSyncedActiveRef.current = realIdx;
        onSetIndex(realIdx);
      }
    }
  };

  const goPrev = () => {
    if (!useLoop) {
      onSetIndex(activeIndex - 1);
      return;
    }
    setAnimate(true);
    setDisplayIndex((prev) => prev - 1);
  };

  const goNext = () => {
    if (!useLoop) {
      onSetIndex(activeIndex + 1);
      return;
    }
    setAnimate(true);
    setDisplayIndex((prev) => prev + 1);
  };

  const handleViewportWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (editorMode || N < 2) return;

    const horizontalDelta =
      Math.abs(event.deltaX) > Math.max(8, Math.abs(event.deltaY) * 1.15)
        ? event.deltaX
        : event.shiftKey && Math.abs(event.deltaY) > 8
          ? event.deltaY
          : 0;

    if (!horizontalDelta) return;

    event.preventDefault();
    event.stopPropagation();

    if (wheelResetTimerRef.current !== null) {
      window.clearTimeout(wheelResetTimerRef.current);
    }
    wheelResetTimerRef.current = window.setTimeout(() => {
      wheelRemainderRef.current = 0;
      wheelResetTimerRef.current = null;
    }, 180);

    wheelRemainderRef.current += horizontalDelta;

    const threshold = 120;
    if (Math.abs(wheelRemainderRef.current) < threshold) return;

    const now = window.performance.now();
    if (now - lastWheelStepAtRef.current < 240) return;
    if (now - lastSwipeStepAtRef.current < 380) return;

    const steps = wheelRemainderRef.current > 0 ? 1 : -1;
    wheelRemainderRef.current -= steps * threshold;
    lastWheelStepAtRef.current = now;
    lastSwipeStepAtRef.current = now;
    setAutoplayStopped(true);
    setAnimate(true);
    setDisplayIndex((prev) => {
      if ((prev <= 0 && steps < 0) || (prev >= N + 1 && steps > 0)) {
        return prev;
      }
      return prev + steps;
    });
  };

  // Map a clicked display index (in expandedItems space) to its real items index
  const realIndexFromDisplay = (dispIdx: number): number => {
    if (!useLoop) return dispIdx;
    if (dispIdx === 0) return N - 1;
    if (dispIdx === N + 1) return 0;
    return dispIdx - 1;
  };

  const handleSlideClick = (dispIdx: number) => {
    if (editorMode) return;
    if (window.performance.now() < suppressClickUntilRef.current) return;
    const realIdx = realIndexFromDisplay(dispIdx);
    const realItem = items[realIdx];
    const isActiveSlot = useLoop
      ? dispIdx === displayIndex
      : dispIdx === activeIndex;
    if (isActiveSlot && (realItem?.videoUrl || realItem?.streamUid)) {
      onPlayVideo(realItem.title, realItem.videoUrl, realItem.streamUid);
      return;
    }
    if (useLoop) {
      setAnimate(true);
      setDisplayIndex(dispIdx);
    } else {
      onSetIndex(dispIdx);
    }
  };

  const handleViewportTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (editorMode || N < 2) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchDeltaXRef.current = 0;
    touchGestureRef.current = "none";
    setDragOffsetPx(0);
    setIsDragging(false);
  };

  const handleViewportTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (editorMode || N < 2) return;
    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    touchDeltaXRef.current = deltaX;

    if (touchGestureRef.current === "none") {
      if (Math.abs(deltaX) > Math.abs(deltaY) + 8) {
        touchGestureRef.current = "horizontal";
      } else if (Math.abs(deltaY) > Math.abs(deltaX) + 8) {
        touchGestureRef.current = "vertical";
      }
    }

    if (touchGestureRef.current === "horizontal") {
      const viewportWidth = viewportRef.current?.clientWidth ?? window.innerWidth ?? 0;
      const maxDrag = viewportWidth * 0.38;
      const nextOffset = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
      setIsDragging(true);
      setDragOffsetPx(nextOffset);
      event.preventDefault();
    }
  };

  const handleViewportTouchEnd = () => {
    if (editorMode || N < 2) return;
    setIsDragging(false);
    if (touchGestureRef.current !== "horizontal") return;

    const viewportWidth =
      viewportRef.current?.clientWidth ?? window.innerWidth ?? 0;
    const threshold = Math.max(58, viewportWidth * 0.17);
    const deltaX = touchDeltaXRef.current;
    if (Math.abs(deltaX) < threshold) {
      setAnimate(true);
      setDragOffsetPx(0);
      return;
    }

    const now = window.performance.now();
    if (now - lastSwipeStepAtRef.current < 380) {
      setAnimate(true);
      setDragOffsetPx(0);
      return;
    }

    setAutoplayStopped(true);
    lastSwipeStepAtRef.current = now;
    suppressClickUntilRef.current = now + 320;
    setAnimate(true);
    setDragOffsetPx(0);

    if (deltaX > 0) {
      goPrev();
      return;
    }
    goNext();
  };

  // Counter shows real position
  const counterIndex = useLoop
    ? ((((displayIndex - 1) % N) + N) % N)
    : activeIndex;

  return (
    <section className={`${sectionClass} ${themeClass(block.theme)}`}>
      <FadeIn variant="up" duration={1000}>
        <div className={styles.sectionHeader}>
          {block.kicker && (
            <RevealText as="p" className={styles.kicker} text={block.kicker} />
          )}
          <RevealText as="h2" text={block.title} staggerMs={54} />
          {block.subtitle && <p>{block.subtitle}</p>}
        </div>
      </FadeIn>
      <div
        ref={viewportRef}
        className={`${styles.lookbookViewport} ${
          showPeek ? styles.lookbookPeek : ""
        }`}
        onWheel={handleViewportWheel}
        onTouchStart={handleViewportTouchStart}
        onTouchMove={handleViewportTouchMove}
        onTouchEnd={handleViewportTouchEnd}
        onTouchCancel={handleViewportTouchEnd}
      >
        <div
          ref={trackRef}
          className={styles.lookbookTrack}
          style={{
            transform: `translateX(${trackTranslatePx + dragOffsetPx}px)`,
            transition: animate && !isDragging ? undefined : "none",
          }}
          onTransitionEnd={snapAfterTransition}
        >
          {expandedItems.map((item, dispIdx) => {
            const isActiveSlot = useLoop
              ? dispIdx === displayIndex
              : dispIdx === activeIndex;
            return (
              <div
                key={`${item.id}-${dispIdx}`}
                role="button"
                tabIndex={editorMode ? -1 : 0}
                className={`${slideClass} ${
                  isActiveSlot ? styles.lookbookSlideActive : ""
                }`}
                onClick={() => handleSlideClick(dispIdx)}
                onKeyDown={(event) => {
                  if (editorMode) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSlideClick(dispIdx);
                  }
                }}
              >
                {renderItem(item, dispIdx, itemVariant)}
              </div>
            );
          })}
        </div>
      </div>
      {N > 1 && (
        <div className={styles.lookbookControls}>
          <button
            type="button"
            className={styles.lookbookArrow}
            onClick={goPrev}
            aria-label="Slide trước"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div className={styles.lookbookCount}>
            <strong>{String(counterIndex + 1).padStart(2, "0")}</strong>
            <span> / {String(N).padStart(2, "0")}</span>
          </div>
          <button
            type="button"
            className={styles.lookbookArrow}
            onClick={goNext}
            aria-label="Slide sau"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </section>
  );
}

export default function FashionEditorialPage({
  content,
  editorMode = false,
  selectedBlockId = null,
  onSelectBlock,
  selectedSubTarget = null,
  onSelectSubTarget,
  onUpdateBlockLayout,
  onUpdateItemLayout,
}: FashionEditorialPageProps) {
  const blockTargetId = (block: FashionBlock, kind: "media" | "text") =>
    `${block.id}::${kind}`;
  const itemTargetId = (block: FashionBlock, item: FashionMediaItem) =>
    `${block.id}::item::${item.id}`;

  const wrapBlockMedia = (block: FashionBlock, node: ReactNode) => {
    if (!editorMode) return node;
    const target = blockTargetId(block, "media");
    return (
      <DragResizeFrame
        enabled
        selected={selectedSubTarget === target}
        layout={block.mediaLayout}
        onSelect={() => onSelectSubTarget?.(target)}
        onChange={(next) => onUpdateBlockLayout?.(block.id, "mediaLayout", next)}
        ariaLabel={`Edit media of ${block.title}`}
      >
        {node}
      </DragResizeFrame>
    );
  };

  const wrapItemMedia = (
    block: FashionBlock,
    item: FashionMediaItem,
    node: ReactNode,
  ) => {
    if (!editorMode) return node;
    const target = itemTargetId(block, item);
    return (
      <DragResizeFrame
        enabled
        selected={selectedSubTarget === target}
        layout={item.mediaLayout}
        onSelect={() => onSelectSubTarget?.(target)}
        onChange={(next) =>
          onUpdateItemLayout?.(block.id, item.id, "mediaLayout", next)
        }
        ariaLabel={`Edit ${item.title}`}
      >
        {node}
      </DragResizeFrame>
    );
  };

  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [activeSlides, setActiveSlides] = useState<Record<string, number>>({});

  const blocks = useMemo(
    () =>
      content.blocks.filter(
        (block) => block.title?.trim() || block.type === "spacer",
      ),
    [content.blocks],
  );

  const openVideo = (title: string, url?: string, streamUid?: string) => {
    const cleanUrl = url?.trim();
    const cleanStreamUid = streamUid?.trim();
    const canUseStream = Boolean(cleanStreamUid && hasCloudflareStreamConfig());
    if (editorMode || (!cleanUrl && !canUseStream)) return;
    setActiveVideo({ title, url: cleanUrl, streamUid: cleanStreamUid });
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
    variant:
      | "carousel"
      | "grid"
      | "pair"
      | "lookbook"
      | "lookbookLandscape"
      | "world",
    parentBlock?: FashionBlock,
  ) => {
    const overlayCaption =
      item.captionPosition === "overlay" ||
      variant === "lookbook" ||
      variant === "lookbookLandscape";
    const itemStyle = resolveLayoutStyle(item.layout);
    const mediaInnerStyle = editorMode
      ? undefined
      : resolveLayoutStyle(item.mediaLayout);
    const mediaCluster = (
      <div className={styles.itemMediaInner} style={mediaInnerStyle}>
        <MediaFrame
          mediaUrl={item.mediaUrl}
          mediaKind={item.mediaKind}
          posterUrl={item.posterUrl}
          streamUid={item.streamUid}
          title={item.title}
          className={mediaClassFor(item.aspect)}
          autoplay={item.mediaKind === "video"}
        />
        {overlayCaption && (
          <div className={styles.itemCaptionOverlay}>
            <span>{item.lookNumber || item.title}</span>
            {item.subtitle && <p>{item.subtitle}</p>}
          </div>
        )}
        {(item.videoUrl || item.streamUid) && (
          <span className={styles.inlinePlay}>View video</span>
        )}
      </div>
    );
    const card = (
      <>
        {parentBlock
          ? wrapItemMedia(parentBlock, item, mediaCluster)
          : mediaCluster}
        {!overlayCaption && (
          <div className={styles.itemCopy}>
            <span className={styles.itemNumber}>
              {item.lookNumber || String(index + 1).padStart(2, "0")}
            </span>
            <h3>{item.title}</h3>
            {item.subtitle && <p>{item.subtitle}</p>}
          </div>
        )}
      </>
    );

    const variantClass =
      variant === "lookbook"
        ? styles.itemCardLookbook
        : variant === "lookbookLandscape"
          ? styles.itemCardLookbookLandscape
          : variant === "world"
            ? styles.itemCardWorld
            : "";
    const className = `${styles.itemCard} ${variantClass}`;

    if ((item.videoUrl || item.streamUid) && !editorMode) {
      return (
        <button
          key={item.id}
          type="button"
          className={className}
          style={itemStyle}
          onClick={() => openVideo(item.title, item.videoUrl, item.streamUid)}
        >
          {card}
        </button>
      );
    }

    if (item.href && !editorMode) {
      return (
        <a key={item.id} className={className} style={itemStyle} href={item.href}>
          {card}
        </a>
      );
    }

    return (
      <article key={item.id} className={className} style={itemStyle}>
        {card}
      </article>
    );
  };

  const renderHero = (block: FashionBlock) => {
    const textStyle = resolveLayoutStyle(block.textLayout);
    return (
      <section className={`${styles.hero} ${themeClass(block.theme)}`}>
        <div className={styles.heroMediaWrap}>
          <MediaFrame
            mediaUrl={block.mediaUrl}
            mediaKind={block.mediaKind}
            posterUrl={block.posterUrl}
            streamUid={block.streamUid}
            title={block.title}
            className={styles.heroMedia}
            preload="auto"
          />
        </div>
        <div className={styles.heroShade} />
        <div className={styles.heroCopy} style={textStyle}>
          {block.kicker && (
            <RevealText
              as="p"
              className={styles.heroKicker}
              text={block.kicker}
              delayMs={120}
            />
          )}
          <RevealText as="h1" text={block.title} delayMs={220} staggerMs={70} />
          {block.subtitle && (
            <RevealText
              as="p"
              className={styles.heroSubtitle}
              text={block.subtitle}
              delayMs={420}
              staggerMs={42}
            />
          )}
          <FadeIn variant="up" delay={500} duration={1000}>
            <div className={styles.actionRow}>
              {(block.videoUrl || block.streamUid) && (
                <PlayButton
                  label={block.ctaLabel || "Xem video"}
                  onClick={() =>
                    openVideo(block.title, block.videoUrl, block.streamUid)
                  }
                />
              )}
              {!(block.videoUrl || block.streamUid) && block.ctaLabel && block.ctaHref && (
                <a className={styles.textLink} href={block.ctaHref}>
                  {block.ctaLabel}
                </a>
              )}
            </div>
          </FadeIn>
        </div>
      </section>
    );
  };

  const renderStatement = (block: FashionBlock) => (
    <section
      className={`${styles.statement} ${themeClass(block.theme)} ${alignClass(block.align)}`}
    >
      {block.kicker && (
        <FadeIn variant="up" duration={900}>
          <RevealText as="p" className={styles.kicker} text={block.kicker} />
        </FadeIn>
      )}
      <FadeIn variant="up" delay={120} duration={1100}>
        <RevealText as="h2" text={block.title} staggerMs={58} />
      </FadeIn>
      {block.body && (
        <FadeIn variant="up" delay={260} duration={1000}>
          <p>{block.body}</p>
        </FadeIn>
      )}
    </section>
  );

  const renderTextIntro = (block: FashionBlock) => {
    const ctaHref = block.ctaHref || "#";
    const isExternalCtaHref = /^https?:\/\//i.test(ctaHref);

    return (
      <section
        className={`${styles.textIntro} ${themeClass(block.theme)} ${alignClass(block.align)}`}
      >
      {block.kicker && (
        <FadeIn variant="up" duration={900}>
          <RevealText as="p" className={styles.kicker} text={block.kicker} />
        </FadeIn>
      )}
      <FadeIn variant="up" delay={120} duration={1100}>
        <RevealText as="h2" text={block.title} staggerMs={54} />
      </FadeIn>
      {block.body && (
        <FadeIn variant="up" delay={260} duration={1000}>
          <p className={styles.textIntroBody}>{block.body}</p>
        </FadeIn>
      )}
      {block.ctaLabel && (
        <FadeIn variant="up" delay={400} duration={900}>
          <a
            className={styles.underlineLink}
            href={ctaHref}
            target={isExternalCtaHref ? "_blank" : undefined}
            rel={isExternalCtaHref ? "noopener noreferrer" : undefined}
            onClick={(event) => {
              if (editorMode) event.preventDefault();
            }}
          >
            {block.ctaLabel}
          </a>
        </FadeIn>
      )}
      </section>
    );
  };

  const renderFeature = (block: FashionBlock) => {
    const mediaStyle = editorMode
      ? undefined
      : resolveLayoutStyle(block.mediaLayout);
    const textStyle = resolveLayoutStyle(block.textLayout);
    const mediaInner = (
      <div className={styles.featureMediaWrap} style={mediaStyle}>
        <MediaFrame
          mediaUrl={block.mediaUrl}
          mediaKind={block.mediaKind}
          posterUrl={block.posterUrl}
          streamUid={block.streamUid}
          title={block.title}
          className={styles.featureMedia}
        />
      </div>
    );
    return (
      <section className={`${styles.feature} ${themeClass(block.theme)}`}>
        <FadeIn variant="left" duration={1100}>
          {wrapBlockMedia(block, mediaInner)}
        </FadeIn>
        <FadeIn variant="right" delay={150} duration={1100}>
          <div className={styles.featureCopy} style={textStyle}>
            {block.kicker && (
              <RevealText as="p" className={styles.kicker} text={block.kicker} />
            )}
            <RevealText as="h2" text={block.title} staggerMs={54} />
            {block.subtitle && <p className={styles.lede}>{block.subtitle}</p>}
            {block.body && <p>{block.body}</p>}
            {(block.videoUrl || block.streamUid) && (
              <PlayButton
                label={block.ctaLabel ?? "View film"}
                onClick={() =>
                  openVideo(block.title, block.videoUrl, block.streamUid)
                }
              />
            )}
            {!(block.videoUrl || block.streamUid) && block.ctaLabel && block.ctaHref && (
              <a className={styles.textLinkDark} href={block.ctaHref}>
                {block.ctaLabel}
              </a>
            )}
          </div>
        </FadeIn>
      </section>
    );
  };

  const renderLookFeature = (block: FashionBlock) => {
    const mediaWrapStyle = editorMode
      ? undefined
      : resolveLayoutStyle(block.mediaLayout);
    const textStyle = resolveLayoutStyle(block.textLayout);
    const inner = (
      <div className={styles.lookFeatureMediaInner} style={mediaWrapStyle}>
        <MediaFrame
          mediaUrl={block.mediaUrl}
          mediaKind={block.mediaKind}
          posterUrl={block.posterUrl}
          streamUid={block.streamUid}
          title={block.title}
          className={styles.lookFeatureMedia}
        />
        {block.lookNumber && (
          <span className={styles.lookFeatureBadge}>{block.lookNumber}</span>
        )}
        {(block.videoUrl || block.streamUid) && !editorMode && (
          <button
            type="button"
            className={styles.lookFeaturePlay}
            onClick={() =>
              openVideo(block.title, block.videoUrl, block.streamUid)
            }
            aria-label={block.ctaLabel || "View film"}
          >
            <span className={styles.playIcon} aria-hidden="true" />
            <span className={styles.playButtonTextWrap}>
              <span className={styles.playButtonText}>
                {block.ctaLabel || "Xem phim"}
              </span>
              <span className={styles.playButtonTextClone} aria-hidden="true">
                {block.ctaLabel || "Xem phim"}
              </span>
            </span>
          </button>
        )}
      </div>
    );
    return (
      <section className={`${styles.lookFeature} ${themeClass(block.theme)}`}>
        <FadeIn
          className={styles.lookFeatureMediaWrap}
          variant="scale"
          duration={1300}
        >
          {wrapBlockMedia(block, inner)}
        </FadeIn>
        <FadeIn variant="up" delay={250} duration={1000}>
          <div className={styles.lookFeatureCopy} style={textStyle}>
            {block.kicker && (
              <RevealText as="p" className={styles.kicker} text={block.kicker} />
            )}
            <RevealText as="h2" text={block.title} staggerMs={48} />
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
        </FadeIn>
      </section>
    );
  };

  const renderEditorialDuo = (block: FashionBlock) => {
    const items = block.items ?? [];
    const left = items.filter((item) => (item.column ?? "left") === "left");
    const right = items.filter((item) => item.column === "right");
    const activeIndex = activeSlides[block.id] ?? 0;

    const renderColumn = (
      list: FashionMediaItem[],
      side: "left" | "right",
    ) => {
      if (list.length === 0) return null;
      const item = list[Math.min(activeIndex, list.length - 1)];
      const valign = item.verticalAlign ?? (side === "left" ? "top" : "bottom");
      const valignClass =
        valign === "top"
          ? styles.duoTop
          : valign === "bottom"
            ? styles.duoBottom
            : styles.duoCenter;
      const itemMediaStyle = editorMode
        ? undefined
        : resolveLayoutStyle(item.mediaLayout);
      const itemStyle = resolveLayoutStyle(item.layout);
      const cardInner = (
        <div className={styles.duoCardInner} style={itemMediaStyle}>
          <MediaFrame
            mediaUrl={item.mediaUrl}
            mediaKind={item.mediaKind}
            posterUrl={item.posterUrl}
            streamUid={item.streamUid}
            title={item.title}
            className={mediaClassFor(item.aspect)}
          />
        </div>
      );
      return (
        <div className={`${styles.duoColumn} ${valignClass}`}>
          <FadeIn
            variant={side === "left" ? "left" : "right"}
            delay={side === "left" ? 0 : 180}
            duration={1100}
          >
            <div className={styles.duoCard} style={itemStyle}>
              {wrapItemMedia(block, item, cardInner)}
              {item.showPlus !== false &&
                (item.videoUrl || item.streamUid) &&
                !editorMode && (
                <button
                  type="button"
                  className={styles.duoPlus}
                  onClick={(event) => {
                    event.stopPropagation();
                    openVideo(item.title, item.videoUrl, item.streamUid);
                  }}
                  aria-label={`View video ${item.title}`}
                >
                  <span>View video</span>
                </button>
              )}
              {list.length > 1 && (
                <div className={styles.duoDots}>
                  {list.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={index === activeIndex ? styles.dotActive : ""}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (editorMode) return;
                        setSlide(block, index);
                      }}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      );
    };

    return (
      <section className={`${styles.editorialDuo} ${themeClass(block.theme)}`}>
        <div className={styles.duoGrid}>
          {renderColumn(left, "left")}
          {renderColumn(right, "right")}
          {block.ctaLabel && (
            <FadeIn
              className={styles.duoCtaWrap}
              variant="scale"
              delay={350}
              duration={900}
            >
              <a
                className={styles.duoCta}
                href={block.ctaHref || "#"}
                onClick={(event) => {
                  if (editorMode) event.preventDefault();
                  event.stopPropagation();
                }}
              >
                {block.ctaLabel}
              </a>
            </FadeIn>
          )}
        </div>
        {(block.kicker || block.subtitle) && (
          <FadeIn variant="up" delay={450} duration={1000}>
            <div className={styles.duoCaption}>
              {block.kicker && <span>{block.kicker}</span>}
              {block.subtitle && <p>{block.subtitle}</p>}
            </div>
          </FadeIn>
        )}
      </section>
    );
  };

  const renderMediaPair = (block: FashionBlock) => (
    <section className={`${styles.blockShell} ${themeClass(block.theme)}`}>
      <FadeIn variant="up" duration={1000}>
        <div className={styles.sectionHeader}>
          {block.kicker && (
            <RevealText as="p" className={styles.kicker} text={block.kicker} />
          )}
          <RevealText as="h2" text={block.title} staggerMs={54} />
          {block.subtitle && <p>{block.subtitle}</p>}
        </div>
      </FadeIn>
      <div className={styles.mediaPair}>
        {(block.items ?? []).map((item, index) => (
          <FadeIn
            key={item.id}
            variant="up"
            delay={150 + index * 130}
            duration={1100}
          >
            {renderItemCard(item, index, "pair", block)}
          </FadeIn>
        ))}
      </div>
    </section>
  );

  const renderCarousel = (block: FashionBlock) => {
    const items = block.items ?? [];
    const activeIndex = activeSlides[block.id] ?? 0;
    return (
      <FadeIn variant="up" duration={1000}>
        <section className={`${styles.blockShell} ${themeClass(block.theme)}`}>
          <div className={styles.sectionHeader}>
            {block.kicker && (
              <RevealText as="p" className={styles.kicker} text={block.kicker} />
            )}
            <RevealText as="h2" text={block.title} staggerMs={54} />
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
          <div className={styles.carousel}>
            <div
              className={styles.carouselTrack}
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {items.map((item, index) => (
                <div key={item.id} className={styles.carouselSlide}>
                  {renderItemCard(item, index, "carousel", block)}
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
      </FadeIn>
    );
  };

  const renderLookbook = (
    block: FashionBlock,
    variant: "portrait" | "landscape" = "portrait",
  ) => (
    <LookbookSection
      block={block}
      activeIndex={activeSlides[block.id] ?? 0}
      editorMode={editorMode}
      variant={variant}
      onSetIndex={(idx) => setSlide(block, idx)}
      onPlayVideo={openVideo}
      renderItem={(item, index, itemVariant) =>
        renderItemCard(item, index, itemVariant, block)
      }
    />
  );

  const renderVideoTeaser = (block: FashionBlock) => (
    <section className={`${styles.videoTeaser} ${themeClass(block.theme)}`}>
      <FadeIn variant="scale" duration={1300}>
        <div className={styles.videoTeaserInner}>
          <MediaFrame
            mediaUrl={block.mediaUrl}
            mediaKind={block.mediaKind}
            posterUrl={block.posterUrl}
            streamUid={block.streamUid}
            title={block.title}
            className={styles.videoTeaserMedia}
            autoplay={block.autoplay !== false}
          />
          <div className={styles.videoTeaserOverlay}>
            {block.kicker && (
              <FadeIn variant="up" delay={300} duration={900}>
                <RevealText
                  as="p"
                  className={styles.videoTeaserKicker}
                  text={block.kicker}
                />
              </FadeIn>
            )}
            <FadeIn variant="up" delay={420} duration={1000}>
              <RevealText as="h2" text={block.title} staggerMs={54} />
            </FadeIn>
            {block.subtitle && (
              <FadeIn variant="up" delay={540} duration={950}>
                <p>{block.subtitle}</p>
              </FadeIn>
            )}
            {(block.videoUrl || block.streamUid) && (
              <FadeIn variant="scale" delay={660} duration={900}>
                <div className={styles.videoTeaserPlayPulse}>
                  <PlayButton
                    label={block.ctaLabel || "Xem teaser"}
                    variant="circle"
                    onClick={() =>
                      openVideo(block.title, block.videoUrl, block.streamUid)
                    }
                  />
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  );

  const renderProjectGrid = (block: FashionBlock) => (
    <section
      id={block.id}
      className={`${styles.blockShell} ${themeClass(block.theme)}`}
    >
      <FadeIn variant="up" duration={1000}>
        <div className={styles.sectionHeader}>
          {block.kicker && (
            <RevealText as="p" className={styles.kicker} text={block.kicker} />
          )}
          <RevealText as="h2" text={block.title} staggerMs={54} />
          {block.subtitle && <p>{block.subtitle}</p>}
        </div>
      </FadeIn>
      <div className={styles.projectGrid}>
        {(block.items ?? []).map((item, index) => (
          <FadeIn
            key={item.id}
            variant="up"
            delay={120 + index * 90}
            duration={1000}
          >
            {renderItemCard(item, index, "grid", block)}
          </FadeIn>
        ))}
      </div>
    </section>
  );

  const renderWorldGrid = (block: FashionBlock) => (
    <section className={`${styles.worldGrid} ${themeClass(block.theme)}`}>
      <FadeIn variant="up" duration={1000}>
        <div className={styles.sectionHeader}>
          {block.kicker && (
            <RevealText as="p" className={styles.kicker} text={block.kicker} />
          )}
          <RevealText as="h2" text={block.title} staggerMs={54} />
          {block.subtitle && <p>{block.subtitle}</p>}
        </div>
      </FadeIn>
      <div className={styles.worldGridList}>
        {(block.items ?? []).map((item, index) => (
          <FadeIn
            key={item.id}
            variant="up"
            delay={120 + index * 110}
            duration={1100}
          >
            {renderItemCard(item, index, "world", block)}
          </FadeIn>
        ))}
      </div>
      {block.ctaLabel && block.ctaHref && (
        <FadeIn variant="up" delay={500} duration={900}>
          <div className={styles.worldGridCta}>
            <a href={block.ctaHref} className={styles.underlineLink}>
              {block.ctaLabel}
            </a>
          </div>
        </FadeIn>
      )}
    </section>
  );

  const renderReviews = (block: FashionBlock) => {
    const items = block.items ?? [];
    const reviewGridClass = `${styles.reviewGrid} ${reviewGridClassFor(items.length)}`;
    return (
      <section className={`${styles.reviewsSection} ${themeClass(block.theme)}`}>
        <FadeIn variant="up" duration={1000}>
          <div className={styles.sectionHeader}>
            {block.kicker && (
              <RevealText as="p" className={styles.kicker} text={block.kicker} />
            )}
            <RevealText as="h2" text={block.title} staggerMs={54} />
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
        </FadeIn>
        <div className={reviewGridClass}>
          {items.map((item, index) => (
            <FadeIn
              key={item.id}
              className={styles.reviewReveal}
              variant="right"
              delay={120 + index * 180}
              duration={950}
            >
              <article className={styles.reviewCard}>
                <span className={styles.itemNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.subtitle && <blockquote>{item.subtitle}</blockquote>}
                <footer>
                  <strong>{item.title}</strong>
                  {item.meta && <span>{item.meta}</span>}
                </footer>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>
    );
  };

  const renderSpacer = (block: FashionBlock) => (
    <div
      className={`${styles.spacer} ${spacerClass(block.spacerSize)} ${themeClass(block.theme)}`}
      aria-hidden="true"
    />
  );

  const renderCta = (block: FashionBlock) => {
    const ctaVideoUrl =
      block.videoUrl?.trim() ||
      (block.mediaKind === "video" ? block.mediaUrl?.trim() : "");
    const hasCtaVideo = Boolean(ctaVideoUrl || block.streamUid?.trim());

    return (
      <section className={`${styles.ctaBlock} ${themeClass(block.theme)}`}>
        <MediaFrame
          mediaUrl={block.mediaUrl}
          mediaKind={block.mediaKind}
          posterUrl={block.posterUrl}
          streamUid={block.streamUid}
          title={block.title}
          className={styles.ctaMedia}
        />
        <div className={styles.ctaCopy}>
          {block.kicker && (
            <FadeIn variant="up" duration={1000}>
              <RevealText as="p" className={styles.kicker} text={block.kicker} />
            </FadeIn>
          )}
          <FadeIn variant="up" delay={120} duration={1100}>
            <RevealText as="h2" text={block.title} staggerMs={54} />
          </FadeIn>
          {block.subtitle && (
            <FadeIn variant="up" delay={250} duration={1000}>
              <p>{block.subtitle}</p>
            </FadeIn>
          )}
          {block.ctaLabel && hasCtaVideo && (
            <FadeIn variant="scale" delay={400} duration={900}>
              <button
                type="button"
                className={styles.ctaAction}
                onClick={() =>
                  openVideo(block.title, ctaVideoUrl || undefined, block.streamUid)
                }
              >
                {block.ctaLabel}
              </button>
            </FadeIn>
          )}
          {block.ctaLabel && !hasCtaVideo && block.ctaHref && (
            <FadeIn variant="scale" delay={400} duration={900}>
              <a href={block.ctaHref} className={styles.ctaAction}>
                {block.ctaLabel}
              </a>
            </FadeIn>
          )}
        </div>
      </section>
    );
  };

  const blockRendererFor = (block: FashionBlock) => {
    switch (block.type) {
      case "hero":
        return renderHero(block);
      case "statement":
        return renderStatement(block);
      case "textIntro":
        return renderTextIntro(block);
      case "feature":
        return renderFeature(block);
      case "lookFeature":
        return renderLookFeature(block);
      case "mediaPair":
        return renderMediaPair(block);
      case "editorialDuo":
        return renderEditorialDuo(block);
      case "carousel":
        return renderCarousel(block);
      case "lookbook":
        return renderLookbook(block, "portrait");
      case "lookbookLandscape":
        return renderLookbook(block, "landscape");
      case "videoTeaser":
        return renderVideoTeaser(block);
      case "projectGrid":
        return renderProjectGrid(block);
      case "worldGrid":
        return renderWorldGrid(block);
      case "reviews":
        return renderReviews(block);
      case "spacer":
        return renderSpacer(block);
      case "cta":
        return renderCta(block);
      default:
        return null;
    }
  };

  const renderBlock = (block: FashionBlock) => {
    const node = blockRendererFor(block);
    if (!node) return null;
    const layoutStyle = resolveLayoutStyle(block.layout);
    if (!editorMode) {
      return (
        <div
          key={block.id}
          id={block.id}
          className={styles.publicBlock}
          style={layoutStyle}
        >
          {node}
        </div>
      );
    }
    const isSelected = block.id === selectedBlockId;
    return (
      <div
        key={block.id}
        id={block.id}
        style={layoutStyle}
        className={`${styles.editorBlockWrap} ${
          isSelected ? styles.editorBlockSelected : ""
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onSelectBlock?.(block.id);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectBlock?.(block.id);
          }
        }}
      >
        <div className={styles.editorBlockBadge}>
          <span>{block.type}</span>
          {block.title && <strong>{block.title}</strong>}
        </div>
        {node}
      </div>
    );
  };

  return (
    <div className={`${styles.page} ${editorMode ? styles.pageEditor : ""}`}>
      {blocks.map(renderBlock)}
      {!editorMode && (
        <VideoPopup
          isOpen={Boolean(activeVideo)}
          title={activeVideo?.title ?? ""}
          videoUrl={activeVideo?.url ?? ""}
          streamUid={activeVideo?.streamUid}
          onClose={() => setActiveVideo(null)}
          fullscreen
        />
      )}
    </div>
  );
}
