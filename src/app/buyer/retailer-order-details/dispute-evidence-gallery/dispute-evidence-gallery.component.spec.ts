import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { DisputeEvidenceGalleryComponent } from './dispute-evidence-gallery.component';
import { RetailerOrderService } from '../retailer-order-details.service';

describe('DisputeEvidenceGalleryComponent', () => {
  let component: DisputeEvidenceGalleryComponent;
  let fixture: ComponentFixture<DisputeEvidenceGalleryComponent>;
  let orderService: jasmine.SpyObj<RetailerOrderService>;

  beforeEach(waitForAsync(() => {
    orderService = jasmine.createSpyObj<RetailerOrderService>(
      'RetailerOrderService',
      ['getReturnDisputeEvidence', 'getReturnDisputeEvidenceFile', 'addReturnDisputeEvidence']
    );
    orderService.getReturnDisputeEvidence.and.returnValue(of({ evidence_urls: [] }));

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        DisputeEvidenceGalleryComponent
      ],
      providers: [
        { provide: RetailerOrderService, useValue: orderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DisputeEvidenceGalleryComponent);
    component = fixture.componentInstance;
    component.disputeId = 12;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads protected evidence through the authenticated service', () => {
    const sourceUrl = 'https://api-staging.melato.net.in/disputes/12/evidence/10/file';
    const imageBlob = new Blob(['image'], { type: 'image/jpeg' });
    orderService.getReturnDisputeEvidence.and.returnValue(of({ evidence_urls: [sourceUrl] }));
    orderService.getReturnDisputeEvidenceFile.and.returnValue(of(imageBlob));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:protected-evidence');

    component.loadEvidenceGallery();

    expect(orderService.getReturnDisputeEvidenceFile).toHaveBeenCalledWith(sourceUrl);
    expect(component.disputeEvidence?.evidenceItems).toEqual([
      jasmine.objectContaining({
        sourceUrl,
        displayUrl: 'blob:protected-evidence',
        loading: false,
        error: null
      })
    ]);
  });
});
