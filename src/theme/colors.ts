// Transcribed directly from the Figma file's "Colour Palette" frame (node 21:54,
// the complete/refined palette — an earlier draft palette at node 4:2 was superseded).
export const teal = {
  50: "#ecf1f3",
  100: "#cfdadf",
  200: "#9fb6be",
  300: "#6e919c",
  400: "#3e6e7b",
  500: "#1a5163",
  600: "#0a4053",
  700: "#003142",
} as const;

export const slate = {
  0: "#ffffff",
  50: "#f6f7f8",
  100: "#edeef0",
  200: "#dee1e4",
  300: "#c6cbcf",
  400: "#9ba2a8",
  500: "#6f777e",
  600: "#515a60",
  700: "#363e44",
  800: "#1c242b",
  900: "#010714",
} as const;

export const gold = {
  50: "#fbf4e6",
  100: "#f6e7c6",
  200: "#f9cd7d",
  300: "#edba60",
  400: "#d3a24c",
  500: "#b8893c",
  600: "#9b7130",
  700: "#7c5a26",
} as const;

export const blue = {
  50: "#e9f1f9",
  100: "#cbe0f0",
  300: "#7fb4dc",
  500: "#2f80b4",
  600: "#256794",
  700: "#1b4c6e",
} as const;

export const yellow = {
  50: "#fdf3e3",
  100: "#fae1bc",
  300: "#f0b45e",
  500: "#e4922e",
  600: "#c4761b",
  700: "#955812",
} as const;

export const red = {
  50: "#fcecea",
  100: "#f8d2ce",
  300: "#e88a82",
  500: "#d64b45",
  600: "#b23a34",
  700: "#8c2a25",
} as const;

export const green = {
  50: "#e9f7f0",
  100: "#c7ebd9",
  300: "#5fc79a",
  500: "#1e9d6a",
  600: "#178055",
  700: "#0f6342",
} as const;

export const colors = {
  teal,
  slate,
  gold,
  blue,
  yellow,
  red,
  green,

  // Semantic tokens used across components/screens
  primary: teal[700],
  primaryDisabled: teal[200],
  primaryPressed: teal[600],
  accent: gold[200],
  accentStrong: gold[500],

  background: slate[0],
  backgroundMuted: slate[50],
  surface: slate[0],
  surfaceSunken: slate[100],
  border: slate[400],
  borderMuted: slate[200],
  divider: slate[200],

  textPrimary: slate[900],
  textSecondary: slate[500],
  textMuted: slate[400],
  textInverse: slate[0],
  placeholder: slate[400],

  success: green[500],
  successBg: green[50],
  successStrong: green[700],
  warning: yellow[500],
  warningBg: yellow[50],
  error: red[600],
  errorBg: red[50],
  errorBorder: red[600],
  info: blue[500],
  infoBg: blue[50],

  online: green[500],
  onlineBg: green[50],
  offline: slate[400],
  offlineBg: slate[100],

  overlay: "rgba(1,7,20,0.55)",
} as const;

export type Colors = typeof colors;
