import type { Metadata } from "next";
import AboutPageView from "@/components/AboutPageView";
import { loadAboutPageContent } from "@/lib/aboutPageContent";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadAboutPageContent();

  return {
    title: content.title,
    description: content.description,
  };
}

export default async function AboutPage() {
  const content = await loadAboutPageContent();

  return <AboutPageView content={content} />;
}
