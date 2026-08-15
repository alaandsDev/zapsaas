import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getAllPosts, fmtDate } from "../../lib/blog";
import { OG_IMAGE } from "../../lib/seo";
import BlogImage from "../../components/BlogImage";

export const metadata = {
  title: "Blog — Estratégias de vendas pelo WhatsApp",
  description:
    "Guias práticos sobre disparo em massa, automação, CRM conversacional e como vender mais pelo WhatsApp sem tomar ban.",
  alternates: { canonical: "/blog" },
  openGraph: {
    url: "https://www.wayvo.app.br/blog",
    title: "Blog Wayvo — Estratégias de vendas pelo WhatsApp",
    description: "Guias práticos para vender mais pelo WhatsApp no automático.",
    images: OG_IMAGE,
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20">
        <div className="text-center mb-14">
          <span className="badge-muted">Blog</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-ink-50">
            Como vender mais pelo{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">WhatsApp</span>
          </h1>
          <p className="mt-4 text-ink-400 max-w-xl mx-auto leading-relaxed">
            Guias práticos sobre disparo, automação e CRM conversacional — direto ao ponto, sem enrolação.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card-hover group overflow-hidden">
              <BlogImage cover={p.cover} height="h-40" />
              <div className="p-5">
                <div className="flex items-center gap-2 text-[11px] text-ink-500 mb-2">
                  <span className="badge-muted">{p.tag}</span>
                  <span>·</span>
                  <span>{fmtDate(p.date)}</span>
                  <span>·</span>
                  <span>{p.readingMinutes} min</span>
                </div>
                <h2 className="text-lg font-bold text-ink-100 group-hover:text-primary transition-colors leading-snug">
                  {p.title}
                </h2>
                <p className="mt-2 text-sm text-ink-400 leading-relaxed">{p.excerpt}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-primary">Ler artigo →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
