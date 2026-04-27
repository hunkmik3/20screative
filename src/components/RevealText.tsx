"use client";

import { createElement, type CSSProperties, type HTMLAttributes } from "react";
import { useScrollFadeIn } from "@/components/useScrollFadeIn";
import styles from "./RevealText.module.css";

type RevealTextTag = "h1" | "h2" | "h3" | "p" | "span";
type RevealDirection = "up" | "down";

interface RevealTextProps extends HTMLAttributes<HTMLElement> {
  text: string;
  as?: RevealTextTag;
  delayMs?: number;
  staggerMs?: number;
  direction?: RevealDirection;
  rootMargin?: string;
}

export default function RevealText({
  text,
  as = "span",
  className = "",
  delayMs = 0,
  staggerMs = 48,
  direction = "up",
  rootMargin = "0px 0px -8% 0px",
  ...rest
}: RevealTextProps) {
  const { ref, visible } = useScrollFadeIn<HTMLElement>({
    threshold: 0.12,
    rootMargin,
  });
  const words = text.trim().split(/\s+/).filter(Boolean);
  return createElement(
    as,
    {
      ...rest,
      ref,
      className: `${styles.revealText} ${
        direction === "down" ? styles.revealTextDown : styles.revealTextUp
      } ${visible ? styles.revealTextVisible : ""} ${className}`,
      style: rest.style,
    },
    words.map((word, index) => (
      <span
        key={`${word}-${index}`}
        className={styles.word}
      >
        <span
          className={styles.inner}
          style={
            {
              transitionDelay: `${delayMs + index * staggerMs}ms`,
            } as CSSProperties
          }
        >
          {word}
        </span>
      </span>
    )),
  );
}
