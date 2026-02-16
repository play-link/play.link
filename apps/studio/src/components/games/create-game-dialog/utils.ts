import {DOMAIN_TO_TYPE} from './constants';

export function detectTypeFromUrl(url: string): string | null {
  for (const [pattern, type] of DOMAIN_TO_TYPE) {
    if (pattern.test(url)) return type;
  }
  return null;
}

export function isValidUrl(url: string): boolean {
  if (!url.trim()) return true;

  try {
    const parsedUrl = new URL(url);
    void parsedUrl;
    return true;
  } catch {
    return false;
  }
}

export function isSteamStoreUrl(url: string): boolean {
  return /\/app\/\d+/.test(url);
}

export function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export function sanitizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50);
}

export function normalizeUrlForComparison(value: string): string {
  return value.trim().toLowerCase().replace(/\/+$/, '');
}
