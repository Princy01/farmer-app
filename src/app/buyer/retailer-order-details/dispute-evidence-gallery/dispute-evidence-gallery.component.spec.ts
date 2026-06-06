import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DisputeEvidenceGalleryComponent } from './dispute-evidence-gallery.component';

describe('DisputeEvidenceGalleryComponent', () => {
  let component: DisputeEvidenceGalleryComponent;
  let fixture: ComponentFixture<DisputeEvidenceGalleryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DisputeEvidenceGalleryComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DisputeEvidenceGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
