import type { CSSProperties } from "react";
import type { FashionLayout } from "@/data/fashionPage";

const trim = (value?: string) =>
  value && value.trim() ? value.trim() : undefined;

export function resolveLayoutStyle(
  layout?: FashionLayout,
): CSSProperties | undefined {
  if (!layout) return undefined;
  const style: CSSProperties = {};
  const maxWidth = trim(layout.maxWidth);
  const width = trim(layout.width);
  const paddingTop = trim(layout.paddingTop);
  const paddingBottom = trim(layout.paddingBottom);
  const paddingX = trim(layout.paddingX);
  const marginTop = trim(layout.marginTop);
  const marginBottom = trim(layout.marginBottom);
  const offsetX = trim(layout.offsetX);
  const offsetY = trim(layout.offsetY);
  const aspectRatio = trim(layout.aspectRatio);
  const scale = trim(layout.scale);
  const rotate = trim(layout.rotate);
  const zIndex = trim(layout.zIndex);
  if (maxWidth) style.maxWidth = maxWidth;
  if (width) style.width = width;
  if (paddingTop) style.paddingTop = paddingTop;
  if (paddingBottom) style.paddingBottom = paddingBottom;
  if (paddingX) {
    style.paddingLeft = paddingX;
    style.paddingRight = paddingX;
  }
  if (marginTop) style.marginTop = marginTop;
  if (marginBottom) style.marginBottom = marginBottom;
  if (aspectRatio) style.aspectRatio = aspectRatio;
  if (zIndex) style.zIndex = Number(zIndex);
  if (layout.textAlign) style.textAlign = layout.textAlign;

  const transforms: string[] = [];
  if (offsetX || offsetY) {
    transforms.push(`translate(${offsetX || "0px"}, ${offsetY || "0px"})`);
  }
  if (scale) transforms.push(`scale(${scale})`);
  if (rotate) transforms.push(`rotate(${rotate})`);
  if (transforms.length > 0) style.transform = transforms.join(" ");

  return Object.keys(style).length > 0 ? style : undefined;
}
