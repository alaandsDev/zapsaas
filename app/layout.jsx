import "./globals.css";
import { ToastProvider } from "../components/Toast";
import FloatingCTA from "../components/FloatingCTA";
import { SpeedInsights } from "@vercel/speed-insights/next";

const SITE_URL = "https://www.wayvo.app.br";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wayvo — Sistema de Vendas Automáticas pelo WhatsApp 24h",
    template: "%s | Wayvo",
  },
  description:
    "Transforme seu WhatsApp em uma máquina de vendas automática. Disparos em massa, chatbot 24/7, automações e CRM. Plano grátis pra começar hoje.",
  applicationName: "Wayvo",
  authors: [{ name: "Wayvo" }],
  generator: "Next.js",
  keywords: [
    "automação whatsapp",
    "disparo em massa whatsapp",
    "vendas automáticas whatsapp",
    "chatbot whatsapp",
    "crm whatsapp",
    "marketing whatsapp",
    "whatsapp business api",
    "envio em massa whatsapp",
    "follow up automático",
    "sistema de vendas whatsapp",
    "wayvo",
    "zap flow",
  ],
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "/",
    languages: { "pt-BR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Wayvo",
    title: "Wayvo — Sistema de Vendas Automáticas pelo WhatsApp 24h",
    description:
      "Venda todos os dias pelo WhatsApp no automático. Disparos em massa, chatbot e CRM. Plano Starter grátis. Pro por R$ 47/mês.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Wayvo — Sistema de Vendas Automáticas pelo WhatsApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wayvo — Vendas Automáticas pelo WhatsApp 24h",
    description:
      "Disparos em massa, chatbot e automações. Comece grátis e venda todos os dias no automático.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "business",
  icons: {
    icon: "/wayvo-icon.png",
    shortcut: "/wayvo-icon.png",
    apple: "/wayvo-icon.png",
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Wayvo",
  url: SITE_URL,
  logo: `${SITE_URL}/wayvo-icon.png`,
  sameAs: [],
  description:
    "Sistema de vendas automáticas pelo WhatsApp: disparos em massa, chatbot 24/7, automações e CRM.",
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Wayvo",
  url: SITE_URL,
  inLanguage: "pt-BR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
      </head>
      <body>
        <ToastProvider>
          {children}
          <FloatingCTA />
          <SpeedInsights />
        </ToastProvider>
      </body>
    </html>
  );
}
