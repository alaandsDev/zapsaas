"use client";
import Script from "next/script";

/**
 * GA4 + Pixel da Meta.
 *
 * Gated por env var — não renderiza nada se não configurado, mesmo padrão do
 * GoogleButton. Para ativar, defina na Vercel:
 *   NEXT_PUBLIC_GA_ID        = G-XXXXXXXXXX
 *   NEXT_PUBLIC_FB_PIXEL_ID  = 000000000000000
 */
const GA_ID    = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export default function Analytics() {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}

      {PIXEL_ID && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}

/**
 * Dispara um evento de conversão nos dois no mesmo lugar.
 * Seguro de chamar mesmo com o rastreamento desligado.
 *
 *   track("Lead", { origem: "modal-preco" })
 *   track("CompleteRegistration")
 */
export function track(event, params = {}) {
  if (typeof window === "undefined") return;
  try {
    if (window.gtag) window.gtag("event", event, params);
    if (window.fbq)  window.fbq("track", event, params);
  } catch (_) {
    // rastreamento nunca pode quebrar o fluxo do usuário
  }
}
