---
target: frontend/src/app/(dashboard)/listings/page.tsx
total_score: 23
p0_count: 1
p1_count: 3
timestamp: 2026-07-06T04-11-12Z
slug: frontend-src-app-dashboard-listings-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Syncing/loading states are present, but native alerts disrupt the flow |
| 2 | Match System / Real World | 3/4 | Good use of ML terminology |
| 3 | User Control and Freedom | 1/4 | No way to cancel sync; no bulk selection checkboxes |
| 4 | Consistency and Standards | 4/4 | Follows standard web conventions well |
| 5 | Error Prevention | 3/4 | Prevents syncing without an account |
| 6 | Recognition Rather Than Recall | 3/4 | Search helps find items, but lacks filtering by status or health |
| 7 | Flexibility and Efficiency | 1/4 | Missing bulk actions; hidden hover actions slow down power users |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean, but slightly noisy with multiple colored badges per row |
| 9 | Error Recovery | 1/4 | Generic `alert()` for errors without actionable recovery steps |
| 10 | Help and Documentation | 1/4 | No tooltip or context explaining how "Saúde" is calculated |
| **Total** | | **23/40** | **Acceptable (Significant improvements needed before users are happy)** |

## Anti-Patterns Verdict

**LLM assessment**: Moderate to High AI slop. The UI relies heavily on standard Tailwind/shadcn patterns without injecting the unique "Modern, Fast, Professional" brand personality. The use of native browser `alert()` for notifications, generic copy, and a templated layout gives it an AI-generated feel that lacks intentional design craft, especially for a tool targeted at power users.

**Deterministic scan**: The automated detector found 1 issue related to an accent border on a rounded element, but this was identified as a **false positive** (it's a CSS-based loading spinner, not a clashing card border). The code is technically clean from structural anti-patterns detected by the CLI.

**Visual overlays**: Skipped. (No live dev server running, so browser visualization was not attempted).

## Overall Impression
The foundation is clean and logical, and empty states guide the user well. However, the biggest opportunity lies in transforming this from a "read-only consumer table" into a "high-density productivity tool" by adding bulk actions, removing jarring native alerts, and reducing color noise.

## What's Working
1. **Clear Data Presentation**: The table structure is logical and groups related metrics (Visits/Sales) effectively.
2. **Empty State Guidance**: Provides clear instructions and context when no listings are found, creating a positive moment of clarity.
3. **Responsive Foundation**: The layout gracefully adapts from flex-col to flex-row and implements horizontal scrolling for the table on smaller screens.

## Priority Issues
- **[P0] Missing Bulk Capabilities**: For a "productivity dashboard to manage ads in bulk," the complete absence of checkboxes and bulk actions is a critical product gap. This forces users into a slow, click-heavy interaction model.
  - *Fix*: Add checkboxes to rows and a sticky bulk action bar.
  - *Suggested command*: `$impeccable shape bulk actions`
- **[P1] Native Alerts**: Using `alert()` for sync success/failure completely undermines the "Modern" and "Professional" brand personality. These disrupt flow and cause jarring emotional spikes.
  - *Fix*: Replace native alerts with a Toast notification system (e.g. Sonner).
  - *Suggested command*: `$impeccable polish`
- **[P1] Color Exhaustion (Cognitive Load)**: Using semantic colors (emerald, amber, red) across Health, Stock, and Status creates visual noise. When everything is highlighted, nothing stands out.
  - *Fix*: Reserve bold semantic colors for items that require immediate action (e.g., zero stock, paused status). Use neutral tints for the rest.
  - *Suggested command*: `$impeccable quieter`
- **[P1] Hidden Actions (Hide-and-Seek UI)**: Hiding the "External Link" action behind a row hover penalizes touch users and adds micro-friction for power users.
  - *Fix*: Make primary row actions permanently visible or use a clean dropdown menu.
  - *Suggested command*: `$impeccable layout`

## Persona Red Flags
**Alex (Power User)**: High-volume sellers prioritize data density, keyboard shortcuts, and bulk operations. This UI forces them into a slow, click-heavy, row-by-row interaction model with local-only filtering that will not scale well for accounts with thousands of listings.

## Minor Observations
- The API URL fallback (`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'`) is exposed directly in the component rather than abstracted in a service.
- The search input only filters loaded data locally. This approach will break or become extremely slow for high-volume sellers.
- A basic spinner feels uninspired and doesn't reassure the user of a "Fast" experience.

## Questions to Consider
- If this is a tool for *bulk* management, why are we forcing users to interact with their listings one by one?
- Are we forcing our users to play hide-and-seek with their tools by hiding actions on hover?
- Why are we relying on 1995's native browser `alert()` for a brand that claims to be "Modern and Professional"?
