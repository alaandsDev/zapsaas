import "./globals.css";

export const metadata = {
  title: "ZapFlow — Sistema de Vendas Automáticas pelo WhatsApp 24h",
  description:
    "Transforme seu WhatsApp em uma máquina de vendas automática. Venda todos os dias, responda clientes na hora e nunca mais perca uma oportunidade.",
  metadataBase: new URL("https://zapflow.vercel.app"),
  openGraph: {
    title: "ZapFlow — Sistema de Vendas Automáticas 24h",
    description:
      "Venda todos os dias pelo WhatsApp no automático. Plano Starter grátis. Pro por R$ 47/mês.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg" },
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
      </head>
      <body>{children}</body>
    </html>
  );
}
