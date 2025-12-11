/**
 * Builder Mode vs Business Mode System
 * Controls platform-level vs single-tenant access
 */

export type PlatformMode = "builder" | "business";

const MODE_STORAGE_KEY = "platform_mode";
const DEFAULT_MODE: PlatformMode = "business";

/**
 * Get current platform mode
 */
export function getMode(): PlatformMode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "builder" || stored === "business") {
      return stored as PlatformMode;
    }
  } catch (error) {
    console.error("Failed to get mode:", error);
  }
  return DEFAULT_MODE;
}

/**
 * Set platform mode
 */
export function setMode(mode: PlatformMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);

    // Trigger custom event for listeners
    window.dispatchEvent(new CustomEvent("mode-changed", { detail: { mode } }));
  } catch (error) {
    console.error("Failed to set mode:", error);
    throw error;
  }
}

/**
 * Check if currently in builder mode
 */
export function isBuilderMode(): boolean {
  return getMode() === "builder";
}

/**
 * Check if currently in business mode
 */
export function isBusinessMode(): boolean {
  return getMode() === "business";
}

/**
 * Toggle between modes
 */
export function toggleMode(): PlatformMode {
  const current = getMode();
  const newMode = current === "builder" ? "business" : "builder";
  setMode(newMode);
  return newMode;
}

/**
 * Check if user has permission to switch modes
 * Only admins can access builder mode
 */
export function canSwitchMode(userRole: string): boolean {
  return userRole === "admin";
}

/**
 * Get mode display information
 */
export function getModeInfo(mode: PlatformMode) {
  return mode === "builder"
    ? {
        label: "Builder Mode",
        description: "Platform owner view - manage all companies and settings",
        icon: "🔧",
        features: [
          "Access to Tenant Admin Console",
          "Create unlimited companies",
          "Toggle features",
          "Test white-label themes"
        ]
      }
    : {
        label: "Business Mode",
        description: "Single company view - focused on your business",
        icon: "💼",
        features: [
          "Locked to one company",
          "Streamlined business tools",
          "No multi-tenant admin tools"
        ]
      };
}
