"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { FashionLayout } from "@/data/fashionPage";
import { resolveLayoutStyle } from "@/lib/fashionLayoutStyle";
import styles from "./DragResizeFrame.module.css";

type Corner = "tl" | "tr" | "bl" | "br";

interface Props {
  children: ReactNode;
  enabled: boolean;
  selected: boolean;
  layout?: FashionLayout;
  onSelect?: () => void;
  onChange?: (next: FashionLayout) => void;
  ariaLabel?: string;
  className?: string;
}

const CORNERS: Corner[] = ["tl", "tr", "bl", "br"];

function parsePx(value?: string, fallback?: number) {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (trimmed.endsWith("px")) {
    const n = parseFloat(trimmed);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

const SNAP_THRESHOLD = 6;

export default function DragResizeFrame({
  children,
  enabled,
  selected,
  layout,
  onSelect,
  onChange,
  ariaLabel,
  className = "",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [guides, setGuides] = useState<{
    v: { x: number; top: number; height: number } | null;
    h: { y: number; left: number; width: number } | null;
  }>({ v: null, h: null });
  const dragRef = useRef<{
    mode: "move" | "resize";
    corner?: Corner;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    startWidth: number;
    startHeight: number;
    baseLeft: number;
    baseTop: number;
    parentLeft: number;
    parentTop: number;
    parentWidth: number;
    parentHeight: number;
    parentCenterX: number;
    parentCenterY: number;
  } | null>(null);

  // Measure size when selected (for size hint chip)
  useEffect(() => {
    if (!selected || !wrapperRef.current) return;
    const node = wrapperRef.current;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [selected]);

  const commit = (patch: Partial<FashionLayout>) => {
    if (!onChange) return;
    onChange({ ...(layout ?? {}), ...patch });
  };

  const captureDragContext = (
    event: React.PointerEvent<HTMLElement>,
    mode: "move" | "resize",
    corner?: Corner,
  ) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const startOffsetX = parsePx(layout?.offsetX, 0) ?? 0;
    const startOffsetY = parsePx(layout?.offsetY, 0) ?? 0;
    const baseLeft = rect.left - startOffsetX;
    const baseTop = rect.top - startOffsetY;
    const parent = wrapperRef.current.parentElement;
    const parentRect = parent
      ? parent.getBoundingClientRect()
      : { left: 0, top: 0, width: 0, height: 0 };
    dragRef.current = {
      mode,
      corner,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX,
      startOffsetY,
      startWidth: rect.width,
      startHeight: rect.height,
      baseLeft,
      baseTop,
      parentLeft: parentRect.left,
      parentTop: parentRect.top,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      parentCenterX: parentRect.left + parentRect.width / 2,
      parentCenterY: parentRect.top + parentRect.height / 2,
    };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  const startMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    if (!selected) {
      onSelect?.();
      return;
    }
    if (!wrapperRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    captureDragContext(event, "move");
  };

  const startResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    corner: Corner,
  ) => {
    if (!enabled || !wrapperRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    captureDragContext(event, "resize", corner);
  };

  const onPointerMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (drag.mode === "move") {
      let newOffsetX = drag.startOffsetX + deltaX;
      let newOffsetY = drag.startOffsetY + deltaY;
      const newCenterX = drag.baseLeft + newOffsetX + drag.startWidth / 2;
      const newCenterY = drag.baseTop + newOffsetY + drag.startHeight / 2;

      const snapV = Math.abs(newCenterX - drag.parentCenterX) < SNAP_THRESHOLD;
      const snapH = Math.abs(newCenterY - drag.parentCenterY) < SNAP_THRESHOLD;

      if (snapV) {
        newOffsetX =
          drag.parentCenterX - drag.baseLeft - drag.startWidth / 2;
      }
      if (snapH) {
        newOffsetY =
          drag.parentCenterY - drag.baseTop - drag.startHeight / 2;
      }

      setGuides({
        v: snapV
          ? {
              x: drag.parentCenterX,
              top: drag.parentTop,
              height: drag.parentHeight,
            }
          : null,
        h: snapH
          ? {
              y: drag.parentCenterY,
              left: drag.parentLeft,
              width: drag.parentWidth,
            }
          : null,
      });

      commit({
        offsetX: `${Math.round(newOffsetX)}px`,
        offsetY: `${Math.round(newOffsetY)}px`,
      });
      return;
    }

    if (drag.mode === "resize" && drag.corner) {
      let newWidth = drag.startWidth;
      let newHeight = drag.startHeight;
      let newOffsetX = drag.startOffsetX;
      let newOffsetY = drag.startOffsetY;

      if (drag.corner === "br") {
        newWidth = drag.startWidth + deltaX;
        newHeight = drag.startHeight + deltaY;
      } else if (drag.corner === "bl") {
        newWidth = drag.startWidth - deltaX;
        newHeight = drag.startHeight + deltaY;
        newOffsetX = drag.startOffsetX + deltaX;
      } else if (drag.corner === "tr") {
        newWidth = drag.startWidth + deltaX;
        newHeight = drag.startHeight - deltaY;
        newOffsetY = drag.startOffsetY + deltaY;
      } else if (drag.corner === "tl") {
        newWidth = drag.startWidth - deltaX;
        newHeight = drag.startHeight - deltaY;
        newOffsetX = drag.startOffsetX + deltaX;
        newOffsetY = drag.startOffsetY + deltaY;
      }

      newWidth = Math.max(80, newWidth);
      newHeight = Math.max(80, newHeight);

      const newCenterX = drag.baseLeft + newOffsetX + newWidth / 2;
      const newCenterY = drag.baseTop + newOffsetY + newHeight / 2;
      const snapV = Math.abs(newCenterX - drag.parentCenterX) < SNAP_THRESHOLD;
      const snapH = Math.abs(newCenterY - drag.parentCenterY) < SNAP_THRESHOLD;
      setGuides({
        v: snapV
          ? {
              x: drag.parentCenterX,
              top: drag.parentTop,
              height: drag.parentHeight,
            }
          : null,
        h: snapH
          ? {
              y: drag.parentCenterY,
              left: drag.parentLeft,
              width: drag.parentWidth,
            }
          : null,
      });

      commit({
        width: `${Math.round(newWidth)}px`,
        maxWidth: `${Math.round(newWidth)}px`,
        offsetX:
          drag.corner === "tl" || drag.corner === "bl"
            ? `${Math.round(newOffsetX)}px`
            : layout?.offsetX,
        offsetY:
          drag.corner === "tl" || drag.corner === "tr"
            ? `${Math.round(newOffsetY)}px`
            : layout?.offsetY,
      });
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setGuides({ v: null, h: null });
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperClass = [
    styles.frame,
    enabled ? styles.frameEnabled : "",
    selected ? styles.frameSelected : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const layoutStyle = enabled ? resolveLayoutStyle(layout) : undefined;
  const wrapperStyle: CSSProperties = {
    ...(layoutStyle ?? {}),
    ...(enabled
      ? { cursor: selected ? "move" : "pointer" }
      : {}),
  };

  return (
    <div
      ref={wrapperRef}
      className={wrapperClass}
      style={wrapperStyle}
      onPointerDown={startMove}
      onClick={(event) => {
        if (!enabled) return;
        event.stopPropagation();
        if (!selected) onSelect?.();
      }}
      role={enabled ? "button" : undefined}
      tabIndex={enabled ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {children}
      {enabled && selected && (
        <>
          <div className={styles.outline} aria-hidden="true" />
          {CORNERS.map((corner) => (
            <button
              key={corner}
              type="button"
              className={`${styles.handle} ${styles[`handle_${corner}`]}`}
              onPointerDown={(event) => startResize(event, corner)}
              aria-label={`Resize from ${corner}`}
              tabIndex={-1}
            />
          ))}
          {size && (
            <div className={styles.sizeHint}>
              {size.w} × {size.h}px
            </div>
          )}
          <div className={styles.moveHint}>↔ drag để di chuyển · góc để resize</div>
        </>
      )}
      {enabled && guides.v && (
        <div
          className={styles.guideVertical}
          style={{
            left: `${guides.v.x}px`,
            top: `${guides.v.top}px`,
            height: `${guides.v.height}px`,
          }}
          aria-hidden="true"
        />
      )}
      {enabled && guides.h && (
        <div
          className={styles.guideHorizontal}
          style={{
            top: `${guides.h.y}px`,
            left: `${guides.h.left}px`,
            width: `${guides.h.width}px`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
