/**
 * White-Label Branding System
 * Manages per-company brand configuration and styling
 */

export interface BrandConfig {
  name: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  sidebarBgColor: string;
  darkMode: boolean;
  customDomain: string;
}

const DEFAULT_BRAND: BrandConfig = {
  name: "Primus Home Pro",
  logoUrl: "",
  primaryColor: "#00ff99",
  accentColor: "#0044ff",
  sidebarBgColor: "#1a1a1a",
  darkMode: true,
  customDomain: ""
};

const STORAGE_PREFIX = "brand_";

/**
 * Load brand configuration for a company
 */
export function loadBrand(companyId: string): BrandConfig {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${companyId}`);
    if (stored) {
      return { ...DEFAULT_BRAND, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load brand config:", error);
  }
  return { ...DEFAULT_BRAND };
}

/**
 * Save brand configuration for a company
 */
export function saveBrand(companyId: string, brandObj: Partial<BrandConfig>): void {
  try {
    const current = loadBrand(companyId);
    const updated = { ...current, ...brandObj };
    localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save brand config:", error);
    throw error;
  }
}

/**
 * Apply brand styling to the document
 */
export function applyBrand(brandObj: BrandConfig): void {
  const root = document.documentElement;

  // Apply CSS custom properties
  root.style.setProperty("--brand-primary", brandObj.primaryColor);
  root.style.setProperty("--brand-accent", brandObj.accentColor);
  root.style.setProperty("--brand-sidebar-bg", brandObj.sidebarBgColor);

  // Apply dark mode class
  if (brandObj.darkMode) {
    root.classList.add("brand-dark-mode");
    root.classList.remove("brand-light-mode");
  } else {
    root.classList.add("brand-light-mode");
    root.classList.remove("brand-dark-mode");
  }

  // Update document title
  if (brandObj.name) {
    document.title = brandObj.name;
  }
}

/**
 * Get all brand configurations (for tenant admin)
 */
export function getAllBrands(): Record<string, BrandConfig> {
  const brands: Record<string, BrandConfig> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const companyId = key.substring(STORAGE_PREFIX.length);
        brands[companyId] = loadBrand(companyId);
      }
    }
  } catch (error) {
    console.error("Failed to load all brands:", error);
  }

  return brands;
}

/**
 * Delete brand configuration
 */
export function deleteBrand(companyId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${companyId}`);
  } catch (error) {
    console.error("Failed to delete brand config:", error);
  }
}

/**
 * Reset brand to default
 */
export function resetBrand(companyId: string): void {
  saveBrand(companyId, DEFAULT_BRAND);
}
