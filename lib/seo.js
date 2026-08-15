// Imagem padrão de compartilhamento (WhatsApp, Facebook, LinkedIn, X).
//
// Precisa ser repetida em TODA page que declara `openGraph`: no Next, o objeto
// do page substitui o do layout inteiro — não faz merge. Sem isso a página vai
// pro ar sem og:image e o link compartilhado aparece como texto cru.
export const OG_IMAGE = [
  {
    url: "/og.png",
    width: 1200,
    height: 630,
    alt: "Wayvo — CRM conversacional, automação e IA no WhatsApp",
  },
];
