import Navbar from "./Navbar";
import Hero from "./Hero";
import Benefits from "./Benefits";
import HowItWorks from "./HowItWorks";
import SocialProof from "./SocialProof";
import Pricing from "./Pricing";
import CTASection from "./CTASection";
import Footer from "./Footer";

export default function NicheLanding({
  eyebrow,
  heroTitle,
  heroHighlight,
  heroSubtitle,
  ctaLabel = "Quero ativar agora",
  benefitsTitle,
  benefits,
  steps,
  stats,
  testimonials,
  finalCTA,
}) {
  return (
    <>
      <Navbar />
      <Hero
        eyebrow={eyebrow}
        title={heroTitle}
        highlight={heroHighlight}
        subtitle={heroSubtitle}
        primaryCTA={{ label: ctaLabel, href: "/register" }}
        secondaryCTA={{ label: "Ver como funciona", href: "#como-funciona" }}
      />
      <Benefits title={benefitsTitle} items={benefits} />
      <HowItWorks steps={steps} title="Pronto em 3 passos" />
      <SocialProof stats={stats} testimonials={testimonials} />
      <Pricing />
      <CTASection
        title={finalCTA.title}
        subtitle={finalCTA.subtitle}
        cta={{ label: ctaLabel, href: "/register" }}
      />
      <Footer />
    </>
  );
}
