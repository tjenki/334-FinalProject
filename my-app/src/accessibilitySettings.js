export const accessibilityStorageKey = "everyday-tracker-accessibility";

export const defaultAccessibilitySettings = {
  textSizeLevel: 0,
  highContrast: false,
  focusMode: false,
};

export function loadAccessibilitySettings() {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(accessibilityStorageKey));
    const textSizeLevel = Number(savedSettings?.textSizeLevel ?? (savedSettings?.largeText ? 1 : 0));

    return {
      ...defaultAccessibilitySettings,
      ...savedSettings,
      textSizeLevel: clampTextSizeLevel(textSizeLevel),
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
}

export function clampTextSizeLevel(value) {
  return Math.min(4, Math.max(0, Number(value) || 0));
}
