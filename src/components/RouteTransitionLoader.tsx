"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import BrandLoadingOverlay from "./BrandLoadingOverlay";

const MIN_VISIBLE_MS = 650;
const MAX_VISIBLE_MS = 6500;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldHandleAnchor(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  return true;
}

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedAtRef = useRef(0);
  const lastPathnameRef = useRef(pathname);
  const finishTimerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    for (const timer of [
      finishTimerRef.current,
      maxTimerRef.current,
      progressTimerRef.current,
    ]) {
      if (timer !== null) window.clearTimeout(timer);
    }
    finishTimerRef.current = null;
    maxTimerRef.current = null;
    progressTimerRef.current = null;
  }, []);

  const finish = useCallback(() => {
    if (!visible || exiting) return;
    const elapsed = window.performance.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    setProgress(1);
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
    }
    finishTimerRef.current = window.setTimeout(() => {
      setExiting(true);
    }, remaining);
  }, [exiting, visible]);

  const show = useCallback(() => {
    clearTimers();
    startedAtRef.current = window.performance.now();
    setProgress(0.08);
    setExiting(false);
    setVisible(true);
    maxTimerRef.current = window.setTimeout(() => {
      setProgress(1);
      setExiting(true);
    }, MAX_VISIBLE_MS);
  }, [clearTimers]);

  useEffect(() => {
    if (!visible || exiting) return;
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 0.92) return current;
        return Math.min(0.92, current + (0.92 - current) * 0.18);
      });
    }, 140);

    return () => {
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [exiting, visible]);

  useEffect(() => {
    if (lastPathnameRef.current === pathname) return;
    lastPathnameRef.current = pathname;
    const frame = window.requestAnimationFrame(finish);
    return () => window.cancelAnimationFrame(frame);
  }, [finish, pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!shouldHandleAnchor(anchor)) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith("/admin")) return;

      const currentPath = `${window.location.pathname}${window.location.search}`;
      const nextPath = `${url.pathname}${url.search}`;
      if (currentPath === nextPath) return;

      show();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [show]);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  if (!visible) return null;

  return (
    <BrandLoadingOverlay
      progress={progress}
      exiting={exiting}
      onExited={() => {
        clearTimers();
        setVisible(false);
        setExiting(false);
        setProgress(0);
      }}
    />
  );
}
