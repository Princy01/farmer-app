import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RestockingRecommendationsComponent } from './restocking-recommendations.component';

describe('RestockingRecommendationsComponent', () => {
  let component: RestockingRecommendationsComponent;
  let fixture: ComponentFixture<RestockingRecommendationsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RestockingRecommendationsComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RestockingRecommendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
