import { Hero } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features-section";
import { AboutSection } from "@/components/landing/about-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Hero />
      <FeaturesSection />
      <AboutSection />
      <FAQSection />
      <CtaSection />
    </div>
  );
}
