import HomeHero from "./HomeHero";

export default function Home() {
  return <HomeHero videoSrc={process.env.NEXT_PUBLIC_HERO_VIDEO_URL} />;
}
