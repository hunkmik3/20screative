import type { FashionPageContent } from "@/data/fashionPage";
import { loadPageContent, savePageContent } from "@/lib/pageContent";

export async function loadFashionPageContent(): Promise<FashionPageContent> {
  return loadPageContent("fashion");
}

export async function saveFashionPageContent(
  content: FashionPageContent,
): Promise<void> {
  return savePageContent("fashion", content);
}
