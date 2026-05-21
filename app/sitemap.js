const SITE_URL = "https://zapflow.vercel.app";

export default function sitemap() {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/clinicas", priority: 0.9, changeFrequency: "weekly" },
    { path: "/delivery", priority: 0.9, changeFrequency: "weekly" },
    { path: "/imobiliarias", priority: 0.9, changeFrequency: "weekly" },
    { path: "/oticas", priority: 0.9, changeFrequency: "weekly" },
    { path: "/login", priority: 0.4, changeFrequency: "yearly" },
    { path: "/register", priority: 0.6, changeFrequency: "yearly" },
    { path: "/changelog", priority: 0.5, changeFrequency: "weekly" },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
