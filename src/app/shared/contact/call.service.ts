import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class CallService {
  constructor(
    private alertController: AlertController,
    private translate: TranslateService
  ) {}

  async placeCall(name: string, phone: string | null | undefined): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      return;
    }

    const isMobile = Capacitor.isNativePlatform() || /Android|iPhone|iPad|iPod|Windows Phone|webOS|Mobile/i.test(
      navigator.userAgent
    );

    const alert = await this.alertController.create({
      header: isMobile
        ? this.translate.instant('CALL.CONFIRM_TITLE')
        : this.translate.instant('CALL.DESKTOP_TITLE', { name }),
      message: isMobile
        ? this.translate.instant('CALL.CONFIRM_MESSAGE')
        : this.translate.instant('CALL.DESKTOP_MESSAGE', {
            name,
            phone: normalizedPhone,
          }),
      buttons: isMobile
        ? [
            {
              text: this.translate.instant('CALL.CANCEL'),
              role: 'cancel',
            },
            {
              text: this.translate.instant('CALL.CALL_NOW'),
              handler: () => {
                window.location.href = `tel:${normalizedPhone}`;
              },
            },
          ]
        : [
            {
              text: this.translate.instant('CALL.CLOSE'),
              role: 'cancel',
            },
          ],
    });

    await alert.present();
  }

  private normalizePhone(phone: string | null | undefined): string | null {
    const value = phone?.trim();
    if (!value) {
      return null;
    }

    const normalized = value.replace(/[\s()-]/g, '');
    return /^\+?[0-9]{7,15}$/.test(normalized) ? normalized : null;
  }
}
