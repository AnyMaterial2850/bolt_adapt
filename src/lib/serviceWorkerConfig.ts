/**
 * Service Worker Configuration
 * 
 * This file contains configuration and helper functions for the service worker.
 * It helps manage caching strategies, versioning, and lifecycle management.
 */

// Cache version - increment this when making significant changes
export const SW_CACHE_VERSION = '1.0.0';

// Cache names with versioning to ensure proper invalidation
export const CACHE_NAMES = {
  STATIC: `static-assets-${SW_CACHE_VERSION}`,
  DYNAMIC: `dynamic-content-${SW_CACHE_VERSION}`,
  IMAGES: `images-${SW_CACHE_VERSION}`,
  API: `api-responses-${SW_CACHE_VERSION}`,
  COMPLETION: `habit-completions-${SW_CACHE_VERSION}`, // Dedicated cache for habit completions
};

// URL patterns for different caching strategies
export const URL_PATTERNS = {
  // Files that should never be cached
  NEVER_CACHE: [
    // Prevent caching of store files to avoid stale state
    /\/src\/stores\/completionStore\.ts$/,
    /\/src\/stores\/habitStore\.ts$/,
    // Other sensitive files
    /\.env$/,
    /auth\/token/,
  ],
  
  // Files that should always be cached with network-first strategy
  NETWORK_FIRST: [
    // API endpoints
    /supabase\.co\/rest\/v1\//,
    // Store-related files
    /\/stores\//,
    /\/services\//,
  ],
  
  // Files that should be cached with stale-while-revalidate
  STALE_WHILE_REVALIDATE: [
    // UI components
    /\/components\//,
    // Pages
    /\/pages\//,
  ],
  
  // Files that should be cached with cache-first strategy
  CACHE_FIRST: [
    // Static assets
    /\.(css|js|html|ico|jpg|jpeg|png|gif|svg|woff|woff2)$/,
    // Google Fonts
    /fonts\.(googleapis|gstatic)\.com/,
  ],
};

/**
 * Helper function to determine if a URL should be cached
 * @param url The URL to check
 * @returns Boolean indicating if the URL should be cached
 */
export function shouldCache(url: string): boolean {
  // Check if URL matches any pattern in NEVER_CACHE
  return !URL_PATTERNS.NEVER_CACHE.some(pattern => pattern.test(url));
}

/**
 * Helper function to determine the appropriate cache name for a URL
 * @param url The URL to check
 * @returns The cache name to use
 */
export function getCacheNameForUrl(url: string): string {
  if (url.includes('habit_comp_track') || url.includes('completion')) {
    return CACHE_NAMES.COMPLETION;
  }
  
  if (url.includes('supabase.co')) {
    return CACHE_NAMES.API;
  }
  
  if (/\.(jpg|jpeg|png|gif|svg)$/.test(url)) {
    return CACHE_NAMES.IMAGES;
  }
  
  return CACHE_NAMES.STATIC;
}

/**
 * Helper function to determine the appropriate caching strategy for a URL
 * @param url The URL to check
 * @returns The caching strategy to use
 */
export function getCachingStrategyForUrl(url: string): 'network-first' | 'stale-while-revalidate' | 'cache-first' | 'no-cache' {
  // Check if URL should never be cached
  if (URL_PATTERNS.NEVER_CACHE.some(pattern => pattern.test(url))) {
    return 'no-cache';
  }
  
  // Check if URL should use network-first strategy
  if (URL_PATTERNS.NETWORK_FIRST.some(pattern => pattern.test(url))) {
    return 'network-first';
  }
  
  // Check if URL should use stale-while-revalidate strategy
  if (URL_PATTERNS.STALE_WHILE_REVALIDATE.some(pattern => pattern.test(url))) {
    return 'stale-while-revalidate';
  }
  
  // Check if URL should use cache-first strategy
  if (URL_PATTERNS.CACHE_FIRST.some(pattern => pattern.test(url))) {
    return 'cache-first';
  }
  
  // Default to network-first for safety
  return 'network-first';
}

/**
 * Helper function to add a unique cache-busting parameter to a URL
 * @param url The URL to add the cache buster to
 * @returns The URL with cache buster added
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
}
