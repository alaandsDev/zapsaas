import { getAllPosts } from "../lib/blog";

const SITE_URL = "https://www.wayvo.app.br";

export default function sitemap() {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/clinicas", priority: 0.9, changeFrequency: "weekly" },
    { path: "/delivery", priority: 0.9, changeFrequency: "weekly" },
    { path: "/imobiliarias", priority: 0.9, changeFrequency: "weekly" },
    { path: "/oticas", priority: 0.9, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/login", priority: 0.4, changeFrequency: "yearly" },
    { path: "/register", priority: 0.6, changeFrequency: "yearly" },
    { path: "/changelog", priority: 0.5, changeFrequency: "weekly" },
  ];

  const staticUrls = routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const postUrls = getAllPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticUrls, ...postUrls];
}
