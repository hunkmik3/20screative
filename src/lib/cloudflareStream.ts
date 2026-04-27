export interface StreamPlayerOptions {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  posterUrl?: string;
}

function normalizeHost(value: string) {
  const clean = value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  if (!clean) return "";
  if (clean.includes("cloudflarestream.com")) return clean;
  if (clean.startsWith("customer-")) return `${clean}.cloudflarestream.com`;
  return `customer-${clean}.cloudflarestream.com`;
}

export function getCloudflareStreamHost() {
  return normalizeHost(
    process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE ?? "",
  );
}

export function hasCloudflareStreamConfig() {
  return Boolean(getCloudflareStreamHost());
}

export function getCloudflareStreamIframeUrl(
  streamUid?: string | null,
  {
    autoplay = false,
    muted = false,
    loop = false,
    controls = true,
    preload,
    posterUrl,
  }: StreamPlayerOptions = {},
) {
  const uid = streamUid?.trim();
  const host = getCloudflareStreamHost();
  if (!uid || !host) return null;

  const url = new URL(`https://${host}/${uid}/iframe`);
  if (autoplay) url.searchParams.set("autoplay", "true");
  if (muted) url.searchParams.set("muted", "true");
  if (loop) url.searchParams.set("loop", "true");
  if (!controls) url.searchParams.set("controls", "false");
  if (preload) url.searchParams.set("preload", preload);
  if (posterUrl?.trim()) url.searchParams.set("poster", posterUrl.trim());

  return url.toString();
}

export function getCloudflareStreamThumbnailUrl(streamUid?: string | null) {
  const uid = streamUid?.trim();
  const host = getCloudflareStreamHost();
  if (!uid || !host) return null;
  return `https://${host}/${uid}/thumbnails/thumbnail.jpg`;
}

export function getCloudflareStreamDownloadUrl(streamUid?: string | null) {
  const uid = streamUid?.trim();
  const host = getCloudflareStreamHost();
  if (!uid || !host) return null;
  return `https://${host}/${uid}/downloads/default.mp4`;
}
