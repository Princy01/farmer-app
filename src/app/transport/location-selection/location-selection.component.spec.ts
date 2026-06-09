import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LocationSelectionModalComponent } from './location-selection.component';

describe('LocationSelectionModalComponent', () => {
  let component: LocationSelectionModalComponent;
  let fixture: ComponentFixture<LocationSelectionModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LocationSelectionModalComponent, IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LocationSelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
