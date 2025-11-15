import { Platform } from "react-native";

const tintColorLight = "#007AFF";
const tintColorDark = "#0A84FF";

export const Colors = {
  light: {
    text: "#000000",
    textSecondary: "#8E8E93",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    link: "#007AFF",
    primary: "#007AFF",
    backgroundRoot: "#FFFFFF", // Elevation 0
    backgroundDefault: "#F2F2F7", // Elevation 1
    backgroundSecondary: "#E9E9EB", // Elevation 2
    backgroundTertiary: "#D9D9D9", // Elevation 3
    surface: "#F2F2F7",
    userBubble: "#007AFF",
    aiBubble: "#E9E9EB",
    userBubbleText: "#FFFFFF",
    aiBubbleText: "#000000",
    border: "#C6C6C8",
    error: "#FF3B30",
    success: "#34C759",
    inputBackground: "#F2F2F7",
    drawerBackground: "#FFFFFF",
    drawerHeaderBackground: "#F2F2F7",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: "#0A84FF",
    primary: "#0A84FF",
    backgroundRoot: "#000000", // Elevation 0
    backgroundDefault: "#1C1C1E", // Elevation 1
    backgroundSecondary: "#2C2C2E", // Elevation 2
    backgroundTertiary: "#404244", // Elevation 3
    surface: "#1C1C1E",
    userBubble: "#0A84FF",
    aiBubble: "#2C2C2E",
    userBubbleText: "#FFFFFF",
    aiBubbleText: "#FFFFFF",
    border: "#38383A",
    error: "#FF453A",
    success: "#32D74B",
    inputBackground: "#1C1C1E",
    drawerBackground: "#000000",
    drawerHeaderBackground: "#1C1C1E",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
