# Lidify Design System

## Brand Colors
- **Primary**: #fca200 (logo gold)
- **Hover**: #e69200 (darker gold for hover states)
- **Light**: #fcb84d (lighter gold for accents)
- **Dark**: #d48c00 (darker gold for emphasis)

## Design Principles
- **Glassmorphism**: Use `backdrop-blur-sm` with semi-transparent cards for premium feel
- **Border Radius**: `rounded-lg` (8px) for modern, edgy feel - avoid overly rounded elements
- **Shadows**: Prefer `shadow-lg`/`shadow-xl` over `shadow-2xl` for subtlety
- **Spacing**: 20-25% tighter than current values for refined look
- **Typography**: Smaller, tighter proportions for elegance

## Component Guidelines

### Buttons
- **Primary CTA**: `bg-brand hover:bg-brand-hover text-black font-bold rounded-lg py-3`
- **Secondary**: `bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5`
- **Avoid**: `rounded-full` (too soft), `rounded-2xl` (too rounded)

### Cards
- **Style**: `rounded-lg backdrop-blur-sm bg-[#111]/90 border border-white/10`
- **Shadow**: `shadow-xl` (subtle, premium)
- **Padding**: `p-6 md:p-8` (tighter than current)

### Form Elements
- **Inputs**: `rounded-lg py-2.5 px-4 bg-white/5 border border-white/10`
- **Focus**: `focus:ring-2 focus:ring-brand/30 focus:border-transparent`
- **Labels**: `text-sm font-medium text-white/90 mb-1.5`

### Typography
- **Page Headings**: `text-2xl` (reduced from `text-3xl`)
- **Section Headings**: `text-xl` (reduced from `text-2xl`)
- **Card Titles**: `text-sm font-semibold`
- **Spacing**: Tighter margins (`mb-1` vs `mb-2`)

## Layout Guidelines

### Login Page
- Logo: `mb-8`, `width={40}`
- Card: `rounded-lg p-6 md:p-8`
- Form: `space-y-4`
- Button: `py-3 rounded-lg`

### Onboarding Page
- Logo: `width={48}`
- Title: `text-4xl`
- Progress: `w-9 h-9` step circles
- Card: `rounded-lg p-6 md:p-8`
- Buttons: `py-3.5 rounded-lg`

## Color Usage
- Replace all `#ecb200` with `#fca200`
- Replace all `#ffc933` with `#e69200`
- Use Tailwind `text-brand`, `bg-brand`, `border-brand` classes
- Update gradient overlays to use new brand color

## Implementation Notes
- Glassmorphism effect: `backdrop-blur-sm` (subtle)
- Card opacity: `bg-[#111]/90` (90% opacity)
- Border consistency: `border-white/10` throughout
- Shadow consistency: `shadow-xl` for cards