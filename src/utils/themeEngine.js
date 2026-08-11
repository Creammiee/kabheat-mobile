/**
 * Kabheat Theme Engine & UI Customizer
 * Dynamically updates UI colors, font families, and glassmorphism styles in real time.
 */

export const COLOR_THEME_PRESETS = [
  {
    id: "sunset",
    name: "Sunset Thermal (Default)",
    primary: "#FA855A",
    accent: "#62C4DA",
    warning: "#FFDE96",
    danger: "#C93638",
    bgDark: "#07050E",
    cardBg: "rgba(255, 255, 255, 0.05)",
    cardBorder: "rgba(255, 255, 255, 0.1)",
    textMain: "#F6FFEA",
    mode: "dark",
  },
  {
    id: "cyberpunk",
    name: "Cyber Neon",
    primary: "#FF007F",
    accent: "#00F3FF",
    warning: "#FFE600",
    danger: "#FF2A6D",
    bgDark: "#080711",
    cardBg: "rgba(255, 0, 127, 0.06)",
    cardBorder: "rgba(0, 243, 255, 0.2)",
    textMain: "#E0F7FA",
    mode: "dark",
  },
  {
    id: "emerald",
    name: "Emerald Matrix",
    primary: "#10B981",
    accent: "#34D399",
    warning: "#FBBF24",
    danger: "#F87171",
    bgDark: "#05130E",
    cardBg: "rgba(16, 185, 129, 0.06)",
    cardBorder: "rgba(52, 211, 153, 0.18)",
    textMain: "#ECFDF5",
    mode: "dark",
  },
  {
    id: "solar",
    name: "Solar Flare",
    primary: "#F59E0B",
    accent: "#3B82F6",
    warning: "#FDE047",
    danger: "#EF4444",
    bgDark: "#120A05",
    cardBg: "rgba(245, 158, 11, 0.07)",
    cardBorder: "rgba(245, 158, 11, 0.2)",
    textMain: "#FFFBEB",
    mode: "dark",
  },
  {
    id: "sapphire",
    name: "Midnight Sapphire",
    primary: "#3B82F6",
    accent: "#8B5CF6",
    warning: "#FCD34D",
    danger: "#EC4899",
    bgDark: "#0A0F1D",
    cardBg: "rgba(59, 130, 246, 0.07)",
    cardBorder: "rgba(139, 92, 246, 0.2)",
    textMain: "#F0F9FF",
    mode: "dark",
  },
  {
    id: "crisp-light",
    name: "Crisp Minimal Light",
    primary: "#EA580C",
    accent: "#0284C7",
    warning: "#D97706",
    danger: "#E11D48",
    bgDark: "#F1F5F9",
    cardBg: "rgba(255, 255, 255, 0.85)",
    cardBorder: "rgba(226, 232, 240, 0.9)",
    textMain: "#0F172A",
    mode: "light",
  },
];

export const FONT_OPTIONS = [
  { id: "Outfit", name: "Outfit (Geometric & Modern)", family: "'Outfit', sans-serif" },
  { id: "Inter", name: "Inter (Clean & Professional)", family: "'Inter', sans-serif" },
  { id: "Space Grotesk", name: "Space Grotesk (Futuristic Tech)", family: "'Space Grotesk', sans-serif" },
  { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans (Sleek UI)", family: "'Plus Jakarta Sans', sans-serif" },
  { id: "Poppins", name: "Poppins (Friendly Round)", family: "'Poppins', sans-serif" },
  { id: "Roboto Mono", name: "Roboto Mono (Telemetry Terminal)", family: "'Roboto Mono', monospace" },
];

export const GLASS_BLUR_OPTIONS = [
  { id: "subtle", name: "Subtle (8px)", blur: "8px" },
  { id: "glass", name: "Standard Glass (16px)", blur: "16px" },
  { id: "heavy", name: "Heavy Frost (24px)", blur: "24px" },
  { id: "solid", name: "Solid Cards (0px)", blur: "0px" },
];

export const DEFAULT_THEME_CONFIG = {
  presetId: "sunset",
  fontId: "Outfit",
  glassBlur: "glass",
  customPrimary: "#FA855A",
  customAccent: "#62C4DA",
  useCustomColors: false,
};

/**
 * Apply Theme Config directly to Document DOM CSS Root Variables
 */
export function applyTheme(config = DEFAULT_THEME_CONFIG) {
  const root = document.documentElement;
  const body = document.body;

  // Find Preset
  const preset = COLOR_THEME_PRESETS.find((p) => p.id === config.presetId) || COLOR_THEME_PRESETS[0];

  const primaryColor = config.useCustomColors ? config.customPrimary : preset.primary;
  const accentColor = config.useCustomColors ? config.customAccent : preset.accent;

  // Set CSS Variables
  root.style.setProperty("--coral-glow", primaryColor);
  root.style.setProperty("--sky-blue", accentColor);
  root.style.setProperty("--tomato-jam", preset.danger);
  root.style.setProperty("--soft-peach", preset.warning);
  root.style.setProperty("--honeydew", preset.textMain);
  root.style.setProperty("--bg-dark", preset.bgDark);
  root.style.setProperty("--card-bg", preset.cardBg);
  root.style.setProperty("--card-border", preset.cardBorder);

  // Set Glass Blur
  const blurVal = GLASS_BLUR_OPTIONS.find((b) => b.id === config.glassBlur)?.blur || "16px";
  root.style.setProperty("--glass-blur", blurVal);

  // Set Font Family
  const fontObj = FONT_OPTIONS.find((f) => f.id === config.fontId) || FONT_OPTIONS[0];
  body.style.fontFamily = fontObj.family;
  body.style.backgroundColor = preset.bgDark;
  body.style.color = preset.textMain;

  if (preset.mode === "light") {
    body.classList.add("theme-light");
  } else {
    body.classList.remove("theme-light");
  }
}
