import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, Subject, timer, EMPTY } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';

interface VerificationState {
  isVerifying: boolean;
  verificationSuccess: boolean;
  verificationError: boolean;
  errorMessage: string;
  countdown: number;
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss',
})
export class VerifyEmailPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isVerifying = true;
  verificationSuccess = false;
  verificationError = false;
  errorMessage = '';
  countdown = 5;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.showError(this.translate.instant('AUTH.INVALID_VERIFICATION_LINK'));
      return;
    }

    this.authService.verifyEmail(token)
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.verificationSuccess = true;
          this.isVerifying = false;
        }),
        switchMap(() => this.startCountdown()),
        catchError((error: any) => {
          this.isVerifying = false;
          let message = this.translate.instant('AUTH.VERIFICATION_FAILED');
          
          if (error.error && error.error.error) {
            if (error.error.error.includes('already been used')) {
              message = this.translate.instant('AUTH.TOKEN_ALREADY_USED');
            } else if (error.error.error.includes('expired')) {
              message = this.translate.instant('AUTH.TOKEN_EXPIRED');
            }
          }
          
          this.showError(message);
          return EMPTY;
        })
      )
      .subscribe();
  }

  private showError(message: string): void {
    this.verificationError = true;
    this.errorMessage = message;
  }

  private startCountdown(): Observable<number> {
    return timer(0, 1000).pipe(
      takeUntil(this.destroy$),
      map(tick => 5 - tick),
      tap(countdown => {
        this.countdown = countdown;
        if (countdown <= 0) {
          this.goToLogin();
        }
      })
    );
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}