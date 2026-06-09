import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PastOrdersComponent } from './past-orders.component';

describe('PastOrdersComponent', () => {
  let component: PastOrdersComponent;
  let fixture: ComponentFixture<PastOrdersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PastOrdersComponent, IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PastOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
