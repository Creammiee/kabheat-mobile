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
    bgDark: "#0C0A14",
    cardBg: "rgba(255, 255, 255, 0.03)",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    textMain: "#F6FFEA",
    mode: "dark",
  },
  {
    id: "cyberpunk",
    name: "Neon Matrix",
    primary: "#FF007A",
    accent: "#00E5FF",
    warning: "#FFEA00",
    danger: "#FF1744",
    bgDark: "#05050A",
    cardBg: "rgba(255, 0, 122, 0.03)",
    cardBorder: "rgba(0, 229, 255, 0.15)",
    textMain: "#E0F7FA",
    mode: "dark",
  },
  {
    id: "monochrome",
    name: "Obsidian Stealth",
    primary: "#FFFFFF",
    accent: "#9CA3AF",
    warning: "#FBBF24",
    danger: "#EF4444",
    bgDark: "#000000",
    cardBg: "rgba(255, 255, 255, 0.05)",
    cardBorder: "rgba(255, 255, 255, 0.1)",
    textMain: "#F9FAFB",
    mode: "dark",
  },
  {
    id: "oceanic",
    name: "Abyssal Blue",
    primary: "#0EA5E9",
    accent: "#38BDF8",
    warning: "#FDE047",
    danger: "#F43F5E",
    bgDark: "#020617",
    cardBg: "rgba(14, 165, 233, 0.04)",
    cardBorder: "rgba(56, 189, 248, 0.15)",
    textMain: "#F0F9FF",
    mode: "dark",
  },
  {
    id: "crisp-light",
    name: "Minimalist Light",
    primary: "#EA580C",
    accent: "#0284C7",
    warning: "#D97706",
    danger: "#E11D48",
    bgDark: "#F8FAFC",
    cardBg: "rgba(255, 255, 255, 0.9)",
    cardBorder: "rgba(15, 23, 42, 0.08)",
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
  useCustomColors: false,
  customPrimary: "#FA855A",
  customAccent: "#62C4DA",
  customWarning: "#FFDE96",
  customDanger: "#C93638",
  customBgDark: "#0C0A14",
  customCardBg: "#2A2A35", // Hex equivalent approximation for color picker
  customCardBorder: "#3F3F4A",
  customTextMain: "#F6FFEA",
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
  const warningColor = config.useCustomColors ? config.customWarning : preset.warning;
  const dangerColor = config.useCustomColors ? config.customDanger : preset.danger;
  const textMainColor = config.useCustomColors ? config.customTextMain : preset.textMain;
  const bgDarkColor = config.useCustomColors ? config.customBgDark : preset.bgDark;
  
  // For card backgrounds, we need them to be slightly transparent to keep the glass effect
  // If they pick a hex color, we apply it. To make it transparent, we could parse it, but for simplicity
  // let's just use the hex they pick. It's fully custom.
  const cardBgColor = config.useCustomColors ? (config.customCardBg + "80") : preset.cardBg; // Append 80 for 50% opacity in hex
  const cardBorderColor = config.useCustomColors ? (config.customCardBorder + "80") : preset.cardBorder;

  // Set CSS Variables
  root.style.setProperty("--coral-glow", primaryColor);
  root.style.setProperty("--sky-blue", accentColor);
  root.style.setProperty("--tomato-jam", dangerColor);
  root.style.setProperty("--soft-peach", warningColor);
  root.style.setProperty("--honeydew", textMainColor);
  root.style.setProperty("--bg-dark", bgDarkColor);
  root.style.setProperty("--card-bg", cardBgColor);
  root.style.setProperty("--card-border", cardBorderColor);

  // Set Glass Blur
  const blurVal = GLASS_BLUR_OPTIONS.find((b) => b.id === config.glassBlur)?.blur || "16px";
  root.style.setProperty("--glass-blur", blurVal);

  // Set Font Family
  const fontObj = FONT_OPTIONS.find((f) => f.id === config.fontId) || FONT_OPTIONS[0];
  body.style.fontFamily = fontObj.family;
  body.style.backgroundColor = bgDarkColor;
  body.style.color = textMainColor;

  if (preset.mode === "light") {
    body.classList.add("theme-light");
  } else {
    body.classList.remove("theme-light");
  }
}
