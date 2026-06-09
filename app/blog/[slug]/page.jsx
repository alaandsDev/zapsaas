import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import JsonLd from "../../../components/JsonLd";
import { getPost, getAllPosts, fmtDate } from "../../../lib/blog";

const SITE = "https://www.wayvo.app.br";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  const url = `${SITE}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

function Block({ b }) {
  if (b.type === "h2") return <h2 className="text-2xl font-bold text-ink-50 mt-10 mb-3">{b.text}</h2>;
  if (b.type === "p") return <p className="text-ink-300 leading-relaxed mb-4">{b.text}</p>;
  if (b.type === "ul")
    return (
      <ul className="space-y-2 mb-4">
        {b.items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-ink-300 leading-relaxed">
            <span className="text-primary mt-0.5 shrink-0">▸</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    );
  if (b.type === "cta")
    return (
      <div className="my-10 p-6 rounded-2xl border border-primary/20 bg-primary/[0.05] text-center">
        <Link href={b.href} className="inline-block px-6 py-3 rounded-xl font-semibold text-bg"
          style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}>
          {b.text} →
        </Link>
      </div>
    );
  return null;
}

export default function BlogPost({ params }) {
  const post = getPost(params.slug);
  if (!post) return notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          author: { "@type": "Organization", name: "Wayvo" },
          publisher: { "@type": "Organization", name: "Wayvo", logo: { "@type": "ImageObject", url: `${SITE}/wayvo-icon.png` } },
          mainEntityOfPage: `${SITE}/blog/${post.slug}`,
        }}
      />
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <Link href="/blog" className="text-sm text-ink-500 hover:text-ink-300">← Voltar ao blog</Link>

        <div className="flex items-center gap-2 text-[11px] text-ink-500 mt-6 mb-3">
          <span className="badge-muted">{post.tag}</span>
          <span>·</span>
          <span>{fmtDate(post.date)}</span>
          <span>·</span>
          <span>{post.readingMinutes} min de leitura</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink-50 leading-tight mb-8">
          {post.title}
        </h1>

        <article>
          {post.content.map((b, i) => <Block key={i} b={b} />)}
        </article>

        <div className="mt-14 pt-8 border-t border-white/[0.08] text-center">
          <p className="text-ink-400 mb-4">Pronto para vender mais pelo WhatsApp no automático?</p>
          <Link href="/register" className="inline-block px-6 py-3 rounded-xl font-semibold text-bg"
            style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}>
            Começar grátis →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
