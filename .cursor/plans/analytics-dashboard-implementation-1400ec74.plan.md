<!-- 1400ec74-1302-4919-bcb5-eb354d630630 c8f37da2-d0bb-4ea5-b8eb-b06236217880 -->
# Landing Page Polish - Professional Sales Page

## Overview

Redesign the landing page (`index.html`) to be a high-converting sales page that makes visitors want to sign up. Focus on benefits, social proof, and clear calls-to-action.

## Current State

- Basic `index.html` exists
- Needs complete visual and content upgrade
- Goal: Convert visitors into trial users

## Sections to Build

### 1. Hero Section (Above the Fold)

**Location:** Top of page, full viewport height

**Content:**

- Left side: Headline + Subheadline + CTAs
  - H1: "Automate Your Social Media in Minutes"
  - Subheadline: Benefit-focused (save time, post everywhere)
  - Primary CTA: "Start Free Trial" → `/auth.html`
  - Secondary CTA: "See Features" → scroll to #features
  - Trust signals: "No credit card • 14-day trial • Cancel anytime"
- Right side: Dashboard screenshot or gradient placeholder
- Dark theme with gradient background

### 2. Features Section

**Layout:** 3x3 grid of feature cards

**Features to highlight:**

1. Multi-Platform Posting (🚀) - Post to 7+ platforms at once
2. AI Caption Generator (🤖) - Claude AI-powered captions
3. Smart Scheduling (📅) - Schedule weeks in advance
4. AI Image Generation (🎨) - Stability AI visuals
5. Analytics Dashboard (📊) - Track performance
6. Bulk CSV Upload (📦) - Upload hundreds at once
7. OAuth Integration (🔐) - Secure account connections
8. Auto-Posting (⚡) - Cron-based automation
9. Multi-Tenant (👥) - Isolated user data

Each card: Icon (emoji) + Title + Description (2-3 lines)

### 3. How It Works (3 Steps)

**Layout:** 3 columns with numbered circles

**Steps:**

1. Connect Your Accounts - OAuth in 30 seconds
2. Create or Generate Content - Write or use AI
3. Schedule & Post - Automation handles the rest

Each step: Number badge + Title + Description

### 4. Pricing Section (Enhanced)

**Layout:** 3 pricing cards side-by-side

**Plans:**

- **Free:** $0/mo - 10 posts, 1 account, basic features
- **Pro:** $29/mo - Unlimited posts, 3 accounts, AI features (MOST POPULAR badge)
- **Business:** $99/mo - 10 accounts, unlimited AI, priority support

Features:

- "Most Popular" badge on Pro plan
- Highlight Pro plan with scale transform and bright color
- Clear feature list per plan
- CTA buttons on each card
- "Start Free Trial" emphasis

### 5. Social Proof Section

**Content:**

- Platform logos (LinkedIn, Twitter, Telegram, Pinterest, Facebook, YouTube, TikTok)
- Stats grid:
  - "7+ Platforms Supported"
  - "10k+ Posts Published" (placeholder)
  - "99% Uptime"
- Testimonial placeholders (optional for now)

### 6. Final CTA Section

**Layout:** Full-width gradient banner (blue → purple)

**Content:**

- Headline: "Ready to Automate Your Social Media?"
- Subheadline: "Join hundreds of creators saving 10+ hours/week"
- Large CTA button: "Start Your Free Trial"
- Trust signals below

### 7. Footer

**Layout:** 4-column grid

**Columns:**

1. Brand: Logo + tagline
2. Product: Features, Pricing, Dashboard links
3. Legal: Terms, Privacy
4. Connect: Email, Twitter, LinkedIn

Bottom: Copyright line

## Styling Requirements

### Design System

- **Dark theme:** bg-gray-950, bg-gray-900 alternating sections
- **Text:** white primary, gray-400 secondary
- **CTAs:** Blue-600 primary, gradient accent buttons
- **Cards:** bg-gray-800 with rounded-lg, subtle shadows
- **Spacing:** py-20 sections, consistent padding

### Animations

- Fade-in on scroll (optional AOS library or simple CSS)
- Hover effects on cards and buttons
- Smooth scroll for anchor links

### Responsive

- Mobile-first design
- Grid collapses to single column on mobile
- Hero stacks vertically on mobile
- Touch-friendly button sizes

### Typography

- H1: text-5xl font-bold
- H2: text-4xl font-bold
- H3: text-2xl font-bold
- Body: text-xl for hero, text-base for cards
- Consistent line-height and spacing

## Technical Implementation

### File to Update

`index.html` - Complete rewrite of body content

### Dependencies

- TailwindCSS (already via CDN in existing file)
- No additional libraries required
- Optional: AOS (Animate On Scroll) library

### Structure

```html
<!DOCTYPE html>
<html class="scroll-smooth">
<head>
  <!-- Keep existing head, ensure Tailwind CDN -->
</head>
<body class="bg-gray-950 text-white">
  <!-- Hero Section -->
  <!-- Features Section -->
  <!-- How It Works Section -->
  <!-- Pricing Section -->
  <!-- Social Proof Section -->
  <!-- Final CTA Section -->
  <!-- Footer -->
</body>
</html>
```

### Key Classes Pattern

- Sections: `py-20` with alternating `bg-gray-900` / `bg-gray-950`
- Containers: `container mx-auto px-6`
- Grids: `grid md:grid-cols-3 gap-8`
- Cards: `bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition`
- Buttons: `px-8 py-4 rounded-lg font-bold transition`

## Copy Guidelines

### Tone

- Confident but not arrogant
- Benefit-focused (save time, grow reach)
- Clear and concise
- Action-oriented CTAs

### Key Messages

1. Save time (10+ hours/week)
2. Post everywhere at once
3. AI-powered (no manual work)
4. Easy to use (3 steps)
5. Risk-free trial

### CTAs Throughout

- "Start Free Trial" (primary)
- "Get Started" (alternative)
- "See Features" (secondary)
- Always include trust signals nearby

## Assets Needed

### Images

- Dashboard screenshot (use placeholder gradient for now)
- Platform logos (use text/emoji for now)
- Optional: Feature illustrations

### Placeholders

- Stats: Use realistic but placeholder numbers
- Testimonials: Can add later
- Screenshots: Gradient boxes with mockup text

## Success Criteria

Landing page should:

1. Load fast (<2s)
2. Be mobile-responsive
3. Have clear value proposition in 5 seconds
4. Multiple CTAs visible without scrolling
5. Professional appearance matching dashboard
6. Clear pricing information
7. Build trust with social proof

## Next Steps After Implementation

1. Add actual dashboard screenshot
2. Get real testimonials from beta users
3. Add conversion tracking (Google Analytics)
4. A/B test headlines
5. Add live chat widget
6. Create explainer video for hero section

### To-dos

- [ ] Read current index.html to understand existing structure and keep any important elements
- [ ] Create hero section with headline, subheadline, CTAs, and placeholder for dashboard image
- [ ] Build 3x3 features grid with 9 key features (icons, titles, descriptions)
- [ ] Create 3-step 'How It Works' section with numbered badges
- [ ] Build 3 pricing cards (Free, Pro, Business) with 'Most Popular' badge on Pro
- [ ] Add social proof section with platform logos and stats grid
- [ ] Create gradient CTA banner section with large call-to-action
- [ ] Build 4-column footer with navigation, legal, and contact links
- [ ] Test and polish mobile responsiveness, add smooth scroll behavior
- [ ] Add hover effects, transitions, and final visual polish