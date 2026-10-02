import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from 'src/app/auth/auth.service';
import { BuyerApiService, mergeCategoryImages } from './buyer-api.service';

describe('BuyerApiService', () => {
  let service: BuyerApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: { getToken: () => '' } }
      ]
    });
    service = TestBed.inject(BuyerApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('hydrates missing category images by category id', () => {
    const categories = [
      { category_id: 14, category_name: 'Melons' },
      { category_id: 15, category_name: 'Stone Fruits', img_path: 'existing-image' }
    ];
    const imageCategories = [
      { category_id: 14, category_name: 'Melons', img_path: 'melon-image' },
      { category_id: 15, category_name: 'Stone Fruits', img_path: 'replacement-image' }
    ];

    expect(mergeCategoryImages(categories, imageCategories)).toEqual([
      { category_id: 14, category_name: 'Melons', img_path: 'melon-image' },
      { category_id: 15, category_name: 'Stone Fruits', img_path: 'existing-image' }
    ]);
  });

  it('returns an empty category list when an empty API response is null', () => {
    expect(mergeCategoryImages(null, undefined)).toEqual([]);
  });
});
