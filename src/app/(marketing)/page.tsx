import { Hero } from "@/components/landing/hero";
import { CtaSection } from "@/components/landing/cta-section";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Hero />
      <CtaSection />
    </div>
  );
}
