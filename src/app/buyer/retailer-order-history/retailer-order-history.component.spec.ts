import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RetailerOrderHistoryComponent } from './retailer-order-history.component';

describe('RetailerOrderHistoryComponent', () => {
  let component: RetailerOrderHistoryComponent;
  let fixture: ComponentFixture<RetailerOrderHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RetailerOrderHistoryComponent, IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RetailerOrderHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
