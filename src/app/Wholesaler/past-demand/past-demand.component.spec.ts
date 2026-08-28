import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PastDemandPage } from './past-demand.component';

describe('PastDemandPage', () => {
  let component: PastDemandPage;
  let fixture: ComponentFixture<PastDemandPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), PastDemandPage]
    }).compileComponents();

    fixture = TestBed.createComponent(PastDemandPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
