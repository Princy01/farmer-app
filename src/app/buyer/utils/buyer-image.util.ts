import { environment } from 'src/environments/environment';

/**
 * Utility functions for resolving and falling back retailer category and product photos.
 */

export const DEFAULT_CATEGORY_FALLBACK = 'assets/img/vegetables.png';
export const DEFAULT_PRODUCT_FALLBACK = 'assets/img/vegetables.png';

/**
 * Normalizes an image path from server / data models into a valid client-side image URL.
 */
export function normalizeImagePath(rawPath?: string | null): string | null {
  if (!rawPath || typeof rawPath !== 'string') {
    return null;
  }
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  if (trimmed.startsWith('data:image/')) {
    const dataUrlMatch = trimmed.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i);
    if (dataUrlMatch && trimmed.length <= 5 * 1024 * 1024) {
      return trimmed;
    }
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const apiOrigin = new URL(environment.apiUrl).origin;
      const currentOrigin = typeof window === 'undefined' ? null : window.location.origin;
      const isLocalDevelopment = url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '::1', '10.0.2.2'].includes(url.hostname);
      const isApprovedOrigin = url.protocol === 'https:' &&
        (url.origin === apiOrigin || url.origin === currentOrigin);

      return isLocalDevelopment || isApprovedOrigin ? trimmed : null;
    } catch {
      return null;
    }
  }

  // Reject unsupported URL schemes instead of treating them as filenames.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return null;
  }

  // Already prefixed with assets/
  if (trimmed.startsWith('assets/')) {
    return trimmed;
  }
  if (trimmed.startsWith('/assets/')) {
    return trimmed.substring(1);
  }

  // If path starts with images/, map to assets/img or assets/images
  if (trimmed.startsWith('images/')) {
    const filename = trimmed.replace(/^images\//, '');
    return `assets/img/${filename}`;
  }

  // Bare filename (e.g. 'tomato.png', 'vegetables.png')
  return `assets/img/${trimmed}`;
}

/**
 * Maps a category or subcategory name (in English or Hindi) to a relevant, high quality local asset.
 */
export function getCategoryFallbackByName(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return DEFAULT_CATEGORY_FALLBACK;
  }

  const lower = name.toLowerCase();

  // Fruit keywords (English & Hindi)
  if (
    lower.includes('fruit') ||
    lower.includes('फल') ||
    lower.includes('citrus') ||
    lower.includes('खट्टे') ||
    lower.includes('berry') ||
    lower.includes('बेरी') ||
    lower.includes('melon') ||
    lower.includes('खरबूजा') ||
    lower.includes('mango') ||
    lower.includes('आम') ||
    lower.includes('banana') ||
    lower.includes('केला') ||
    lower.includes('apple') ||
    lower.includes('सेब') ||
    lower.includes('grape') ||
    lower.includes('अंगूर') ||
    lower.includes('guava') ||
    lower.includes('अमरूद') ||
    lower.includes('papaya') ||
    lower.includes('पपीता')
  ) {
    return 'assets/img/fruits.png';
  }

  // Leafy vegetables
  if (
    lower.includes('leaf') ||
    lower.includes('पत्ता') ||
    lower.includes('पत्ते') ||
    lower.includes('spinach') ||
    lower.includes('पालक') ||
    lower.includes('coriander') ||
    lower.includes('धनिया') ||
    lower.includes('methi') ||
    lower.includes('मेथी')
  ) {
    return 'assets/img/Spinach.png';
  }

  // Roots / Carrots / Radish / Beetroot
  if (
    lower.includes('root') ||
    lower.includes('जड़') ||
    lower.includes('carrot') ||
    lower.includes('गाजर') ||
    lower.includes('radish') ||
    lower.includes('मूली') ||
    lower.includes('beet') ||
    lower.includes('चुकंदर')
  ) {
    return 'assets/img/Carrot.png';
  }

  // Gourds & Pumpkins
  if (
    lower.includes('gourd') ||
    lower.includes('pumpkin') ||
    lower.includes('लौकी') ||
    lower.includes('कद्दू') ||
    lower.includes('करेला') ||
    lower.includes('तुरई') ||
    lower.includes('गिलकी') ||
    lower.includes('cucumber') ||
    lower.includes('खीरा')
  ) {
    return 'assets/img/Gourd.png';
  }

  // Cole crops (Cabbage, Broccoli, Cauliflower)
  if (
    lower.includes('cole') ||
    lower.includes('cabbage') ||
    lower.includes('cauliflower') ||
    lower.includes('broccoli') ||
    lower.includes('गोभी') ||
    lower.includes('ब्रोकली')
  ) {
    return 'assets/img/Broccoli1.png';
  }

  // Tuber & Bulbs (Potato, Onion, Garlic, Ginger)
  if (
    lower.includes('tuber') ||
    lower.includes('bulb') ||
    lower.includes('potato') ||
    lower.includes('आलू') ||
    lower.includes('कंद')
  ) {
    return 'assets/img/Potato1.png';
  }

  if (
    lower.includes('onion') ||
    lower.includes('प्याज') ||
    lower.includes('garlic') ||
    lower.includes('लहसुन')
  ) {
    return 'assets/img/Onion1.png';
  }

  // Legumes (Peas, Beans)
  if (
    lower.includes('legume') ||
    lower.includes('pea') ||
    lower.includes('bean') ||
    lower.includes('फली') ||
    lower.includes('मटर')
  ) {
    return 'assets/img/Peas.png';
  }

  // Tomatoes / Solanaceous
  if (
    lower.includes('tomato') ||
    lower.includes('टमाटर') ||
    lower.includes('brinjal') ||
    lower.includes('eggplant') ||
    lower.includes('बैंगन')
  ) {
    return 'assets/img/Tomato.png';
  }

  // Organic vegetables
  if (lower.includes('organic') || lower.includes('जैविक')) {
    return 'assets/img/Vegetables2.png';
  }

  // General vegetables
  return DEFAULT_CATEGORY_FALLBACK;
}

/**
 * Maps a product name to a relevant local product asset when image_path is missing.
 */
export function getProductFallbackByName(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return DEFAULT_PRODUCT_FALLBACK;
  }

  const lower = name.toLowerCase();

  if (lower.includes('tomato') || lower.includes('टमाटर')) return 'assets/img/Tomato.png';
  if (lower.includes('potato') || lower.includes('आलू')) return 'assets/img/Potato1.png';
  if (lower.includes('onion') || lower.includes('प्याज')) return 'assets/img/Onion1.png';
  if (lower.includes('carrot') || lower.includes('गाजर')) return 'assets/img/Carrot.png';
  if (lower.includes('spinach') || lower.includes('पालक') || lower.includes('methi') || lower.includes('मेथी')) return 'assets/img/Spinach.png';
  if (lower.includes('broccoli') || lower.includes('ब्रोकली') || lower.includes('cauliflower') || lower.includes('cabbage') || lower.includes('गोभी')) return 'assets/img/Broccoli1.png';
  if (lower.includes('pea') || lower.includes('मटर') || lower.includes('bean') || lower.includes('फली')) return 'assets/img/Peas.png';
  if (lower.includes('gourd') || lower.includes('लौकी') || lower.includes('कद्दू') || lower.includes('करेला') || lower.includes('खीरा') || lower.includes('cucumber')) return 'assets/img/Gourd.png';
  if (lower.includes('lettuce')) return 'assets/img/Lettuce.png';
  if (lower.includes('asparagus')) return 'assets/img/Asparagus.png';

  // If fruit
  if (
    lower.includes('fruit') || lower.includes('फल') ||
    lower.includes('apple') || lower.includes('banana') ||
    lower.includes('mango') || lower.includes('orange') ||
    lower.includes('grape') || lower.includes('papaya')
  ) {
    return 'assets/img/fruits.png';
  }

  return DEFAULT_PRODUCT_FALLBACK;
}

/**
 * Returns a fully resolved image URL for a category or subcategory.
 */
export function resolveCategoryImageUrl(
  category?: { category_name?: string; img_path?: string } | null,
  fallbackName?: string
): string {
  const normalized = normalizeImagePath(category?.img_path);
  if (normalized) {
    return normalized;
  }
  const name = category?.category_name || fallbackName;
  return getCategoryFallbackByName(name);
}

/**
 * Returns a fully resolved image URL for a product.
 */
export function resolveProductImageUrl(
  product?: { product_name?: string; image_path?: string } | null
): string {
  const normalized = normalizeImagePath(product?.image_path);
  if (normalized) {
    return normalized;
  }
  return getProductFallbackByName(product?.product_name);
}
