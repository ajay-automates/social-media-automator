# DASHBOARD PAGES UI UPDATE — Instructions for Claude Code

## READ THIS FIRST

The dashboard foundation is already updated (tailwind.config.js, index.css, App.jsx). 
The navigation bar is already redesigned with the new dark theme + cyan accent.

Now update ALL individual page files in `dashboard/src/pages/` and `dashboard/src/components/` 
to match the new design system. Run `npm run dev` in the `dashboard/` directory and verify 
each page visually after updating.

## DESIGN SYSTEM REFERENCE

**Background colors:**
- Page background: `bg-[#0a0a0b]` (inherited from App.jsx)
- Cards/sections: `bg-[#111113]` with `border border-white/[0.06]`
- Elevated/hover: `bg-[#18181b]`
- Input fields: `bg-[#18181b]` with `border border-white/[0.06]` and `focus:border-[#22d3ee]`

**Text colors:**
- Primary text: `text-white` or `text-zinc-100`
- Secondary text: `text-zinc-400`
- Muted/labels: `text-zinc-500`
- Accent: `text-[#22d3ee]`

**Accent color (cyan):**
- Buttons primary: `bg-[#22d3ee] text-[#0a0a0b] hover:bg-[#06b6d4]`
- Active states: `text-[#22d3ee]` or `bg-[#22d3ee]/10`
- Focus rings: `focus:ring-[#22d3ee]/30` or `focus:border-[#22d3ee]`
- Links: `text-[#22d3ee]`

**Borders:**
- Default: `border-white/[0.06]`
- Hover: `border-white/[0.12]`
- Accent: `border-[#22d3ee]/30`

**Border radius:**
- Cards: `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px)
- Inputs: `rounded-lg` (8px)
- Badges/pills: `rounded-full`

**Typography:**
- Page titles: `font-display text-2xl` (Instrument Serif)
- Section headers: `text-lg font-semibold` (DM Sans)
- Body text: `text-sm` or `text-[13px]` (DM Sans)
- Labels: `text-xs font-medium text-zinc-500 uppercase tracking-wider`
- Monospace numbers/code: `font-mono`

**Buttons:**
- Primary: `bg-[#22d3ee] text-[#0a0a0b] font-semibold px-4 py-2 rounded-lg hover:bg-[#06b6d4] transition-colors`
- Secondary: `bg-[#18181b] text-zinc-300 border border-white/[0.06] px-4 py-2 rounded-lg hover:bg-[#1f1f23] hover:border-white/[0.12] transition-colors`
- Danger: `bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors`
- Ghost: `text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] px-3 py-1.5 rounded-lg transition-colors`

**Cards:**
```jsx
<div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.12] transition-colors">
```

**Form inputs:**
```jsx
<input className="w-full bg-[#18181b] border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#22d3ee] focus:outline-none transition-colors" />
```

**Select dropdowns:**
```jsx
<select className="bg-[#18181b] border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#22d3ee] focus:outline-none transition-colors">
```

**Tables:**
```jsx
// Table container
<div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
  // Header
  <div className="border-b border-white/[0.06] px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
  // Rows
  <div className="px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
```

**Modals/Dialogs:**
```jsx
// Overlay
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
  // Modal
  <div className="bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 max-w-lg w-full mx-4 p-6">
```

**Badges/Tags:**
```jsx
<span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20">
```

**Status indicators:**
```jsx
// Success
<span className="w-2 h-2 rounded-full bg-emerald-400" />
// Warning  
<span className="w-2 h-2 rounded-full bg-amber-400" />
// Error
<span className="w-2 h-2 rounded-full bg-red-400" />
```

**Empty states:**
```jsx
<div className="text-center py-16">
  <div className="text-zinc-600 text-4xl mb-4">[icon]</div>
  <h3 className="text-zinc-300 font-medium mb-2">No items yet</h3>
  <p className="text-zinc-500 text-sm mb-6">Description text here</p>
  <button className="bg-[#22d3ee] text-[#0a0a0b] ...">Action</button>
</div>
```

## SEARCH-AND-REPLACE PATTERNS

Apply these global replacements across ALL files. These cover 80% of the changes:

```
BACKGROUNDS:
bg-gray-50          → bg-[#0a0a0b]
bg-gray-100         → bg-[#111113]
bg-gray-200         → bg-[#18181b]
bg-gray-800         → bg-[#111113]
bg-gray-900         → bg-[#0a0a0b]
bg-gray-950         → bg-[#0a0a0b]
bg-white            → bg-[#111113]
bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950  → bg-[#0a0a0b]
bg-gradient-to-br from-gray-800  → bg-[#111113]

TEXT:
text-gray-900       → text-white
text-gray-800       → text-zinc-100
text-gray-700       → text-zinc-300
text-gray-600       → text-zinc-400
text-gray-500       → text-zinc-400
text-gray-400       → text-zinc-500
text-gray-300       → text-zinc-500

BORDERS:
border-gray-200     → border-white/[0.06]
border-gray-300     → border-white/[0.08]
border-gray-600     → border-white/[0.08]
border-gray-700     → border-white/[0.06]
border-gray-800     → border-white/[0.06]
border-white/10     → border-white/[0.06]
border-white/20     → border-white/[0.08]

ACCENTS (replace blue/purple gradients with cyan):
bg-blue-600         → bg-[#22d3ee]
bg-blue-500         → bg-[#22d3ee]
bg-purple-600       → bg-[#22d3ee]
hover:bg-blue-700   → hover:bg-[#06b6d4]
hover:bg-blue-600   → hover:bg-[#06b6d4]
text-blue-400       → text-[#22d3ee]
text-blue-300       → text-[#22d3ee]
text-blue-500       → text-[#22d3ee]
text-purple-400     → text-[#22d3ee]
text-purple-300     → text-[#22d3ee]
ring-blue-500       → ring-[#22d3ee]
focus:ring-blue-500 → focus:ring-[#22d3ee]/30
from-blue-600 to-purple-600  → bg-[#22d3ee]
from-blue-500 to-purple-500  → bg-[#22d3ee]
from-blue-400 to-purple-400  → text-[#22d3ee]
bg-gradient-to-r from-blue-600 to-purple-600 → bg-[#22d3ee]
bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 → bg-[#22d3ee]

BUTTONS on cyan background need dark text:
Any button with bg-[#22d3ee] needs: text-[#0a0a0b]

INPUTS:
bg-gray-700         → bg-[#18181b]
focus:ring-2 focus:ring-blue-500 → focus:border-[#22d3ee] focus:outline-none

SHADOWS:
shadow-2xl          → shadow-2xl shadow-black/40
shadow-lg           → shadow-lg shadow-black/30

HOVER STATES:
hover:bg-gray-100   → hover:bg-white/[0.04]
hover:bg-gray-200   → hover:bg-white/[0.06]
hover:bg-gray-700   → hover:bg-[#1f1f23]
hover:bg-gray-800   → hover:bg-[#18181b]
hover:bg-white/5    → hover:bg-white/[0.04]
hover:bg-white/10   → hover:bg-white/[0.06]
```

## FILES TO UPDATE (in priority order)

### Priority 1: Most-used pages
1. `dashboard/src/pages/Dashboard.jsx` (22KB) — Home page, stat cards, recent activity
2. `dashboard/src/pages/Calendar.jsx` (31KB) — Calendar grid, post previews
3. `dashboard/src/pages/CreatePost.jsx` (133KB) — Post editor, platform selector, scheduling
4. `dashboard/src/pages/ContentAgent.jsx` (70KB) — AI content generation
5. `dashboard/src/pages/Analytics.jsx` (62KB) — Charts, metrics, engagement data
6. `dashboard/src/pages/ConnectAccounts.jsx` (56KB) — Platform connection cards

### Priority 2: Supporting pages
7. `dashboard/src/pages/Settings.jsx` (9KB)
8. `dashboard/src/pages/Pricing.jsx` (13KB)
9. `dashboard/src/pages/Templates.jsx` (35KB)
10. `dashboard/src/pages/Team.jsx` (22KB)
11. `dashboard/src/pages/Business.jsx` (41KB)
12. `dashboard/src/pages/BulkUpload.jsx` (20KB)

### Priority 3: Secondary pages  
13. `dashboard/src/pages/Webhooks.jsx` (29KB)
14. `dashboard/src/pages/ABTesting.jsx` (22KB)
15. `dashboard/src/pages/ContentRecycling.jsx` (28KB)
16. `dashboard/src/pages/HashtagAnalytics.jsx` (16KB)
17. `dashboard/src/pages/Approvals.jsx` (16KB)
18. `dashboard/src/pages/CreateCarousel.jsx` (16KB)
19. `dashboard/src/pages/AdminUsers.jsx` (13KB)
20. `dashboard/src/pages/PaymentSuccess.jsx` (4KB)
21. `dashboard/src/pages/PaymentCancel.jsx` (3KB)
22. `dashboard/src/pages/AcceptInvitation.jsx` (6KB)

### Priority 4: Shared components
23. `dashboard/src/components/BillingSettings.jsx`
24. `dashboard/src/components/NotificationBell.jsx`
25. `dashboard/src/components/UpgradeModal.jsx`
26. `dashboard/src/components/PostPreview.jsx`
27. `dashboard/src/components/MilestoneChecklist.jsx`
28. `dashboard/src/components/ContentIdeasModal.jsx`
29. `dashboard/src/components/CaptionImproverModal.jsx`
30. `dashboard/src/components/CarouselCaptionModal.jsx`
31. `dashboard/src/components/ImageCaptionModal.jsx`
32. `dashboard/src/components/VideoSearchModal.jsx`
33. `dashboard/src/components/VideoPreview.jsx`
34. `dashboard/src/components/RoleBadge.jsx`
35. All files in `dashboard/src/components/calendar/`
36. All files in `dashboard/src/components/dashboard/`
37. All files in `dashboard/src/components/onboarding/`
38. All files in `dashboard/src/components/ui/`

## PROCESS

For each file:
1. Open the file
2. Apply the search-and-replace patterns above
3. Check for any remaining light-mode colors (white backgrounds, light grays)
4. Update page titles to use `font-display` (Instrument Serif)
5. Replace gradient backgrounds/buttons with solid cyan accent
6. Make sure all buttons with cyan bg have dark text (`text-[#0a0a0b]`)
7. Save and verify the page looks correct in the browser

After all files are done:
```bash
cd dashboard
npm run build
```

Push to main for Railway auto-deploy.

## KEY RULES

1. **DO NOT change any functionality** — only change styling/classes
2. **DO NOT remove any components or routes** — only update their appearance
3. **DO NOT change any API calls, state management, or event handlers**
4. Keep all motion/framer-motion animations — just update colors inside them
5. Test after each major page to make sure nothing broke
6. The `glass` utility class used in some components should map to `bg-[#111113]/80 backdrop-blur-xl border border-white/[0.06]`
