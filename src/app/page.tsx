import styles from "./page.module.css";

export default function Home() {
  // YouTube video ID extracted from the embed URL
  const youtubeVideoId = "p0xD0gHt9Es";

  return (
    <div className={styles.hero}>
      {/* YouTube Video Background - Fullscreen */}
      <div className={styles.videoContainer}>
        <iframe
          className={styles.youtubeVideo}
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          title="20sCreative Showreel"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Fallback gradient background */}
      <div className={styles.fallbackBg} />

      {/* Very subtle overlay for header readability */}
      <div className={styles.overlay} />
    </div>
  );
}
