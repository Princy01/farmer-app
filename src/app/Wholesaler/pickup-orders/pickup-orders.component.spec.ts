import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { WholesalerPickupOrdersComponent } from './pickup-orders.component';

describe('WholesalerPickupOrdersComponent', () => {
  let component: WholesalerPickupOrdersComponent;
  let fixture: ComponentFixture<WholesalerPickupOrdersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [WholesalerPickupOrdersComponent, IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(WholesalerPickupOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
