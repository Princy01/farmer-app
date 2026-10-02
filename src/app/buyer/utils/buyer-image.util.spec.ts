import {
  getCategoryFallbackByName,
  getProductFallbackByName,
  normalizeImagePath,
} from './buyer-image.util';

describe('buyer image utilities', () => {
  it('normalizes local assets and bare filenames', () => {
    expect(normalizeImagePath('/assets/img/Tomato.png')).toBe('assets/img/Tomato.png');
    expect(normalizeImagePath('tomato.png')).toBe('assets/img/tomato.png');
  });

  it('rejects unsupported remote image origins and invalid data URLs', () => {
    expect(normalizeImagePath('https://example.invalid/product.png')).toBeNull();
    expect(normalizeImagePath('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
  });

  it('selects localized category and product fallbacks', () => {
    expect(getCategoryFallbackByName('फल')).toBe('assets/img/fruits.png');
    expect(getProductFallbackByName('टमाटर')).toBe('assets/img/Tomato.png');
  });
});
