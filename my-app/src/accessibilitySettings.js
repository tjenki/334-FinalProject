export const accessibilityStorageKey = "everyday-tracker-accessibility";

export const defaultAccessibilitySettings = {
  textSizeLevel: 0,
  highContrast: false,
  focusMode: false,
  pageColor: "#176b5b",
};

export function loadAccessibilitySettings() {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(accessibilityStorageKey));
    const textSizeLevel = Number(savedSettings?.textSizeLevel ?? (savedSettings?.largeText ? 1 : 0));

    return {
      ...defaultAccessibilitySettings,
      ...savedSettings,
      textSizeLevel: clampTextSizeLevel(textSizeLevel),
      pageColor: cleanColor(savedSettings?.pageColor),
    };
  } catch {
    return defaultAccessibilitySettings;
  }
}

export function saveAccessibilitySettings(settings) {
  localStorage.setItem(accessibilityStorageKey, JSON.stringify(settings));
  applyAccessibilitySettings(settings);
}

export function applyAccessibilitySettings(settings = loadAccessibilitySettings()) {
  const textSizeLevel = clampTextSizeLevel(settings.textSizeLevel);
  const pageColor = cleanColor(settings.pageColor);

  document.body.classList.remove(
    "accessibility-text-size-0",
    "accessibility-text-size-1",
    "accessibility-text-size-2",
    "accessibility-text-size-3",
    "accessibility-text-size-4",
    "accessibility-large-text"
  );
  document.body.classList.add(`accessibility-text-size-${textSizeLevel}`);
  document.body.classList.toggle("accessibility-high-contrast", settings.highContrast);
  document.body.classList.toggle("accessibility-focus-mode", settings.focusMode);
  document.body.style.setProperty("--user-color", pageColor);
  document.body.style.setProperty("--user-color-dark", darkenColor(pageColor, 28));
  document.body.style.setProperty("--user-color-soft", softenColor(pageColor, 84));
}

export function clampTextSizeLevel(value) {
  return Math.min(4, Math.max(0, Number(value) || 0));
}

export function cleanColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : defaultAccessibilitySettings.pageColor;
}

function darkenColor(hex, percent) {
  return mixColors(hex, "#000000", percent);
}

function softenColor(hex, percent) {
  return mixColors(hex, "#ffffff", percent);
}

function mixColors(hex, mixHex, percent) {
  const color = hexToRgb(hex);
  const mix = hexToRgb(mixHex);
  const amount = percent / 100;

  return rgbToHex({
    r: Math.round(color.r * (1 - amount) + mix.r * amount),
    g: Math.round(color.g * (1 - amount) + mix.g * amount),
    b: Math.round(color.b * (1 - amount) + mix.b * amount),
  });
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}
