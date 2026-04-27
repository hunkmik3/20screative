import { getCloudflareStreamIframeUrl } from "@/lib/cloudflareStream";

interface CloudflareStreamPlayerProps {
  streamUid?: string | null;
  title: string;
  className: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  posterUrl?: string;
  allowFullscreen?: boolean;
}

export default function CloudflareStreamPlayer({
  streamUid,
  title,
  className,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  preload,
  posterUrl,
  allowFullscreen = true,
}: CloudflareStreamPlayerProps) {
  const src = getCloudflareStreamIframeUrl(streamUid, {
    autoplay,
    muted,
    loop,
    controls,
    preload,
    posterUrl,
  });

  if (!src) return null;

  return (
    <iframe
      className={className}
      src={src}
      title={title || "Video"}
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen={allowFullscreen}
    />
  );
}
