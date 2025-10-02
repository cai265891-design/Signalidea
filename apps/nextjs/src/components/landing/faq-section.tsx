"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@saasfly/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "What's free vs. what costs credits?",
    answer:
      "Entering your research query and reviewing the AI-generated Top-5 shortlist is completely free. You only spend credits when you choose to pull evidence (step 3) and generate the full report (step 4). This lets you validate the direction before committing.",
  },
  {
    id: "2",
    question: "How long does a report take?",
    answer:
      "Most reports complete in 2–5 minutes. Step 1 (intent parsing) and Step 2 (Top-5 generation) happen instantly. Steps 3–4 (evidence gathering and assembly) typically take 2–3 minutes depending on the number of sources and competitors analyzed.",
  },
  {
    id: "3",
    question: "Can I edit the Top-5 before pulling evidence?",
    answer:
      "Yes. After we suggest a Top-5 shortlist, you can add, remove, or swap competitors before proceeding. This ensures you're only gathering evidence on the products or tools that matter most to your research.",
  },
  {
    id: "4",
    question: "What sources do you pull from?",
    answer:
      "We scan Reddit discussions, Hacker News threads, Product Hunt reviews, and select community forums. Each claim in your report includes direct citations so you can verify the source and dive deeper if needed.",
  },
];

export function FAQSection() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about our research workflow
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border-gray-200 dark:border-gray-800"
            >
              <AccordionTrigger className="text-left text-gray-900 hover:text-[#2D6BFF] dark:text-gray-100 dark:hover:text-[#2D6BFF]">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Still have questions?{" "}
            <a
              href="mailto:support@signialidea.com"
              className="font-medium text-[#2D6BFF] hover:underline"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
