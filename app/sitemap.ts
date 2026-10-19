import type { MetadataRoute } from "next";

const SITE_URL = "https://m4ster-5in1.pages.dev";

const PAGES = [
  { path: "/", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/play", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/play/snake", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/play/connect4", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/play/memory", priority: 0.8, changeFrequency: "weekly" as const },
  {
    path: "/play/tictactoe",
    priority: 0.8,
    changeFrequency: "weekly" as const,
  },
  { path: "/play/guessing", priority: 0.8, changeFrequency: "weekly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
