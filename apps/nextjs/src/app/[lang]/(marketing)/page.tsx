import { getDictionary } from "~/lib/get-dictionary";

import { HeroSection } from "~/components/landing/hero-section";
import { SampleReports } from "~/components/landing/sample-reports";
import { HowItWorks } from "~/components/landing/how-it-works";
import { PricingSection } from "~/components/landing/pricing-section";
import { FAQSection } from "~/components/landing/faq-section";

import type { Locale } from "~/config/i18n-config";

export default async function IndexPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  const dict = await getDictionary(lang);

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Sample Reports Carousel */}
      <SampleReports />

      {/* How it Works */}
      <HowItWorks />

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <FAQSection />
    </>
  );
}
