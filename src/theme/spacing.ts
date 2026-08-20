export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

// Buttons/inputs use radius 10 per the Figma "States of Input and Buttons"
// frame; larger surfaces (cards, sheets, screens) use the larger steps.
export const radius = {
  control: 10,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const screenPadding = spacing.lg;
