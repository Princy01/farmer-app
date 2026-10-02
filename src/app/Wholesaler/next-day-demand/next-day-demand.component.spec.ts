import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NextDayDemandPage } from './next-day-demand.component';

describe('NextDayDemandPage', () => {
  let component: NextDayDemandPage;
  let fixture: ComponentFixture<NextDayDemandPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), NextDayDemandPage]
    }).compileComponents();

    fixture = TestBed.createComponent(NextDayDemandPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
