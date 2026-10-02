import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const translateService = {
    addLangs: jasmine.createSpy('addLangs'),
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
  };

  afterEach(() => {
    document.body.classList.remove('dark', 'ion-palette-dark');
    document.documentElement.classList.remove('dark', 'ion-palette-dark');
  });

  it('should create the app', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useValue: translateService },
      ]
    }).compileComponents();
    
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should enforce the light theme at startup', async () => {
    document.body.classList.add('dark', 'ion-palette-dark');
    document.documentElement.classList.add('dark', 'ion-palette-dark');

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useValue: translateService },
      ]
    }).compileComponents();

    TestBed.createComponent(AppComponent);

    expect(document.body.classList.contains('dark')).toBeFalse();
    expect(document.body.classList.contains('ion-palette-dark')).toBeFalse();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBeFalse();
  });
});
