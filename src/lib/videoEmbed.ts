export interface YoutubeEmbedOptions {
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
}

export function getYoutubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      return parts[0] ?? null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isYoutubeUrl(url: string) {
  return Boolean(getYoutubeVideoId(url));
}

export function isVideoFileUrl(url?: string | null) {
  return Boolean(url?.trim().match(/\.(mp4|mov|m4v|webm)(?:[?#].*)?$/i));
}

export function getYoutubeThumbnailUrl(url: string) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function toYoutubeEmbedUrl(
  url: string,
  {
    autoplay = true,
    muted = false,
    controls = true,
    loop = false,
  }: YoutubeEmbedOptions = {},
) {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return null;

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  embedUrl.searchParams.set("autoplay", autoplay ? "1" : "0");
  embedUrl.searchParams.set("rel", "0");
  embedUrl.searchParams.set("modestbranding", "1");
  embedUrl.searchParams.set("iv_load_policy", "3");
  embedUrl.searchParams.set("playsinline", "1");
  embedUrl.searchParams.set("controls", controls ? "1" : "0");

  if (muted) embedUrl.searchParams.set("mute", "1");
  if (loop) {
    embedUrl.searchParams.set("loop", "1");
    embedUrl.searchParams.set("playlist", videoId);
  }

  return embedUrl.toString();
}
