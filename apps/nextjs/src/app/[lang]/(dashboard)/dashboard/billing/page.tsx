"use client";

import { BillingPage } from "~/components/pipeline/billing-page";

const mockTransactions = [
  {
    id: "1",
    date: "2024-01-15",
    stage: "Evidence Pull",
    credits: -18,
    reason: "Deep analysis run",
    type: "charge" as const,
  },
  {
    id: "2",
    date: "2024-01-14",
    stage: "Feature Matrix",
    credits: -16,
    reason: "Feature comparison",
    type: "charge" as const,
  },
  {
    id: "3",
    date: "2024-01-14",
    stage: "Evidence Pull",
    credits: 3,
    reason: "Partial rollback - unused queries",
    type: "refund" as const,
  },
  {
    id: "4",
    date: "2024-01-12",
    stage: "Credit Purchase",
    credits: 50,
    reason: "Additional credits purchased",
    type: "purchase" as const,
  },
  {
    id: "5",
    date: "2024-01-10",
    stage: "Report Builder",
    credits: -12,
    reason: "PDF export",
    type: "charge" as const,
  },
];

const mockInvoices = [
  {
    id: "INV-2024-001",
    date: "January 1, 2024",
    amount: 99,
    status: "paid" as const,
    downloadUrl: "#",
  },
  {
    id: "INV-2023-012",
    date: "December 1, 2023",
    amount: 99,
    status: "paid" as const,
    downloadUrl: "#",
  },
  {
    id: "INV-2023-011",
    date: "November 1, 2023",
    amount: 99,
    status: "paid" as const,
    downloadUrl: "#",
  },
];

export default function Billing() {
  return (
    <BillingPage
      currentPlan="Pro"
      monthlyCredits={{ used: 32, total: 100 }}
      transactions={mockTransactions}
      invoices={mockInvoices}
      hasFirstReportDiscount={false}
      defaultCap={true}
      onToggleDefaultCap={(enabled) => console.log("Toggle default cap:", enabled)}
      onBuyCredits={() => console.log("Buy credits")}
      onUpgradePlan={() => console.log("Upgrade plan")}
    />
  );
}
