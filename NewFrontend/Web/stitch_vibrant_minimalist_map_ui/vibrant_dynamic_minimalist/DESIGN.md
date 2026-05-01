---
name: Vibrant Dynamic Minimalist
colors:
  surface: '#f9f9fe'
  surface-dim: '#d9dade'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f8'
  surface-container: '#ededf2'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#414755'
  inverse-surface: '#2e3034'
  inverse-on-surface: '#f0f0f5'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006687'
  on-secondary: '#ffffff'
  secondary-container: '#60cdff'
  on-secondary-container: '#005572'
  tertiary: '#ba0034'
  on-tertiary: '#ffffff'
  tertiary-container: '#e51245'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#c1e8ff'
  secondary-fixed-dim: '#74d1ff'
  on-secondary-fixed: '#001e2b'
  on-secondary-fixed-variant: '#004d67'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b5'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#920027'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-caps:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 12px
---

## Brand & Style

This design system is built for the modern Chinese mobile landscape, blending high-efficiency minimalism with a "灵动" (dynamic) spirit. The brand personality is optimistic, energetic, and premium, avoiding the cluttered "super-app" aesthetic in favor of intentional whitespace and fluid motion.

The design style utilizes **Glassmorphism** and **Tonal Layers** to create depth without heaviness. Backgrounds remain clean and airy, while interactive elements use vibrant gradients to guide the user's eye. Every transition is designed to feel elastic and natural, echoing the effortless flow of water.

## Colors

The palette centers on a "Digital Azure" primary blue, optimized for high-density mobile displays. Secondary colors utilize a palette of "harmonious vibrance"—soft teals and energetic magentas—to provide functional contrast for data and status indicators. 

Neutrals are slightly cool-toned to maintain a fresh, modern feel. The use of gradients is purposeful: they are reserved for primary actions and "dynamic" indicators to signify interactivity and momentum. Backgrounds use a multi-layered white system to distinguish between content areas without relying on harsh lines.

## Typography

The typography system prioritizes legibility for Hanzi (Chinese characters) alongside Latin numerals. **Plus Jakarta Sans** provides a friendly, geometric personality for headers, while **Be Vietnam Pro** offers an approachable, high-clarity experience for body text.

For Chinese rendering, use a system stack (PingFang SC) paired with these tokens. Maintain a generous line height (1.5x minimum for body text) to account for the visual density of complex characters. Bold weights are used sparingly for visual hierarchy, ensuring the "minimalist" feel is preserved.

## Layout & Spacing

This design system employs a **Fluid Grid** model based on a 4px baseline. Mobile layouts utilize a 4-column structure with 20px outer margins to provide "breathing room" (留白). 

Spacing is used to group related information; smaller increments (4px, 8px) link elements like icons and labels, while larger increments (24px, 32px) define section boundaries. Vertical rhythm is critical: prioritize generous top-padding in view headers to create a premium, unhurried user experience.

## Elevation & Depth

Visual hierarchy is achieved through **Ambient Shadows** and **Tonal Layers** rather than heavy borders. 
- **Level 1:** Flat surfaces for the main background.
- **Level 2:** Subtle "card" elevation using a 10% opacity primary-tinted shadow (0px 4px 20px).
- **Level 3:** Interactive elements and floating buttons using "soft glow" shadows that inherit the color of the element (e.g., a blue button casts a soft blue shadow).

Glassmorphism is applied to persistent elements like navigation bars and top headers, using a high-intensity backdrop blur (20px) and a 1px semi-transparent white border to simulate light catching the edge of a glass pane.

## Shapes

The shape language is consistently **Rounded**, reflecting the "friendly and dynamic" brand pillars. Standard cards and containers use a 16px radius, while smaller components like tags and input fields use an 8px radius. Full pill shapes (height/2) are reserved for primary Call-to-Action buttons and status chips to emphasize their "pressable" nature.

## Components

- **Bottom Navigation:** A "floating" glassmorphic bar with active states indicated by a vibrant gradient icon and a soft-glow dot. Icons should animate slightly (scale up 10%) when selected.
- **Location Indicators:** Minimalist "pulsing" dots using the primary blue gradient. When expanded, they show clean cards with 16px corner radii and high-contrast typography.
- **Data Visualization:** Focus on "Chart-Minimalism." Use rounded-cap bar charts and smooth-curve line graphs. Use the primary-to-secondary gradient for data fills and neutral-200 for axes/grids.
- **Buttons:** Primary buttons use the 135-degree "Accent Gradient" with a subtle drop shadow. Ghost buttons use a 1.5px border with the primary color and no fill.
- **Input Fields:** Clean, borderless designs with a subtle grey background (#F2F2F7). On focus, the background remains, but a 1.5px primary color border animates in from the center.
- **Chips/Tags:** Small, pill-shaped elements with low-saturation versions of the primary/secondary colors to indicate categories without competing with buttons.