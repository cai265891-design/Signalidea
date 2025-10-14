# Pipeline Components

A comprehensive set of components for the competitive intelligence pipeline feature, implementing a three-column application layout with six stage cards, inspector panel, and billing system.

## Architecture

### Layout Structure

The pipeline uses a three-column layout:
- **Left Sidebar (~280px)**: Scope configuration panel with editable fields
- **Center Column**: Pipeline board with vertical stage cards
- **Right Panel (~320px)**: Inspector showing credits, run status, and history

### Component Overview

#### Core Components

1. **StageCard** - Reusable card pattern with multiple states
   - States: idle, running, needs-approval, approved, failed, stale
   - Features: progress bar, action buttons, error handling, skeleton loading
   - Location: `stage-card.tsx`

2. **ScopePanel** - Left sidebar configuration
   - Editable fields: region, time window, excludes, seed URLs
   - Sticky positioning for scroll persistence
   - Location: `scope-panel.tsx`

3. **Inspector** - Right sidebar for credits & history
   - Estimated credits display with progress ring
   - Monthly credits balance
   - Run history with status indicators
   - Cap toggle functionality
   - Location: `inspector.tsx`

#### Stage Components

All stages follow the free → paid transition model with clear credit estimates.

1. **IntentClarifier** (Free)
   - Displays parsed scope from user input
   - Confirm button to propagate changes
   - Download brief.json functionality
   - Location: `intent-clarifier.tsx`

2. **CandidateFinder** (Free)
   - Compact table with 8-15 candidates
   - Columns: name, tagline, website, last update, confidence
   - Quick actions: Add to shortlist, Blacklist
   - Zebra striping and hover states
   - Location: `candidate-finder.tsx`

3. **TopFiveReview** (Free & Required Gate)
   - Drag-and-drop reorderable list
   - Replace competitor functionality
   - Credit estimate display (~16-18 credits)
   - Approval gate before paid stages
   - Location: `top-five-review.tsx`

4. **EvidencePull** (Credits)
   - Two-panel cluster view
   - Left: Topic clusters with sentiment bars
   - Right: Reddit posts with external links
   - Re-pull with 60% discount option
   - Location: `evidence-pull.tsx`

5. **MatrixForge** (Credits)
   - Dense, performant data table
   - Sticky headers, horizontal scroll
   - Inline cell editing with undo
   - Currency normalization
   - CSV export
   - Location: `matrix-forge.tsx`

6. **ReportBuilder** (Credits)
   - Split view: controls + live preview
   - Section toggles
   - Opportunity cards with risk levels
   - HTML/PDF export
   - Location: `report-builder.tsx`

#### Supporting Components

1. **CreditsModal** - Pre-payment confirmation
   - Estimated credits display
   - Cap toggle ($19 default)
   - Free trial badge (if eligible)
   - "Learn how credits work" link
   - Location: `credits-modal.tsx`

2. **BillingPage** - Usage & billing management
   - Current plan display
   - Monthly credits progress bar
   - Transaction history table
   - Invoice list with downloads
   - Default cap preference
   - Location: `billing-page.tsx`

## Design System

### Visual Tokens

```typescript
// Colors
primary: "#2D6BFF"        // Electric blue
navy: "#0B1B3B"           // Deep navy backgrounds
accent: "#77A3FF"         // Light blue accents
text: "#0A0A0A" / "#3A3A3A"
border: "#E5E7EB"

// Radius
input: 16px
card: 18px
button: 12px

// Shadows
Soft, low elevation
```

### Motion Guidelines

- Micro-interactions only: 120-180ms transitions
- Gentle fades and lifts
- Drag-and-drop with subtle spring animations
- Skeleton rows instead of spinners
- Performance-safe animations

### Accessibility

- Minimum contrast: 4.5:1
- Clear focus outlines
- Large hit areas on primary actions
- Keyboard navigation in tables
- No text under 14px
- Responsive breakpoints: sm/md/lg

## Usage Examples

### Basic Pipeline Page

```typescript
import {
  ScopePanel,
  Inspector,
  IntentClarifier,
  CandidateFinder,
  TopFiveReview,
  EvidencePull,
  MatrixForge,
  ReportBuilder,
  CreditsModal
} from "~/components/pipeline";

export default function PipelinePage() {
  return (
    <div className="grid grid-cols-[280px_1fr_320px] gap-6">
      <aside><ScopePanel /></aside>
      <main className="space-y-4">
        <IntentClarifier />
        <CandidateFinder />
        <TopFiveReview />
        <EvidencePull />
        <MatrixForge />
        <ReportBuilder />
      </main>
      <aside><Inspector /></aside>
    </div>
  );
}
```

### Toast Notifications

```typescript
import { useToast } from "@saasfly/ui/use-toast";

const { toast } = useToast();

// Success
toast({
  title: "Report ready",
  description: "HTML and PDF saved to your library.",
});

// Warning with action
toast({
  title: "Upstream changes detected",
  description: "This section may be outdated.",
  variant: "destructive",
  action: <button onClick={rerun}>Re-run now</button>
});

// Error with retry
toast({
  title: "Couldn't reach Reddit",
  description: "Retrying in 5s…",
  action: <button>Retry now</button>
});
```

## State Management

Each stage manages its own state internally. For cross-component state:

```typescript
// Example: Credits modal trigger
const [showCreditsModal, setShowCreditsModal] = useState(false);

<TopFiveReview
  onApprove={() => setShowCreditsModal(true)}
/>

<CreditsModal
  open={showCreditsModal}
  onOpenChange={setShowCreditsModal}
  onProceed={(capped) => {
    // Handle approval
    setShowCreditsModal(false);
  }}
/>
```

## Routes

- `/pipeline` - Main pipeline page
- `/billing` - Billing & usage page

## API Integration

### Current Implementation: Next.js API Route (not tRPC)

The pipeline uses **Next.js API Routes** instead of tRPC for n8n webhook integration:

**API Endpoint**: `/api/n8n/analyze`
- Location: `apps/nextjs/src/app/api/n8n/analyze/route.ts`
- Method: POST
- Payload: `{ input: string }`
- Returns: Structured analysis data validated with Zod

**Example Usage**:
```typescript
const response = await fetch("/api/n8n/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ input: userRequirement }),
});
const data = await response.json();
```

**Environment Variables**:
- `N8N_WEBHOOK_URL`: n8n webhook endpoint
- `N8N_API_KEY`: Optional Bearer token for authentication

## Next Steps

1. ✅ ~~Connect to tRPC API endpoints~~ → Using Next.js API Routes for n8n integration
2. Implement real drag-and-drop with `@dnd-kit/core`
3. Add Stripe integration for credit purchases
4. Implement actual PDF/HTML export functionality
5. Add real-time status updates via WebSocket
6. Implement credit pre-hold and rollback logic
7. Add API endpoints for other stages (Candidate Finder, Evidence Pull, etc.)

## Notes

- All components use Inter for UI text
- JetBrains Mono for code/table numerics (to be added)
- Toast system already integrated via existing UI package
- Components are fully typed with TypeScript
- All components support dark mode (though default is light)
