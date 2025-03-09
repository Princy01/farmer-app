import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuyerPage } from './buyer.page';

describe('BuyerPage', () => {
  let component: BuyerPage;
  let fixture: ComponentFixture<BuyerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
