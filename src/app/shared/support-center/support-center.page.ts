import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { CallService } from '../contact/call.service';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline, arrowBackOutline, callOutline, cardOutline,
  checkmarkCircleOutline, chevronForwardOutline, cubeOutline, documentTextOutline,
  helpCircleOutline, mailOutline, personOutline, storefrontOutline, carOutline,
  warningOutline, navigateOutline, sendOutline
} from 'ionicons/icons';

// 'transport' kept as an alias so existing routes don't break during migration.
// Internally, everything treats it as 'driver'.
type SupportRole = 'buyer' | 'wholesaler' | 'driver';

interface SupportCategory {
  id: string;
  icon: string;
  options: string[];
}

interface SupportContactResponse {
  support_phone: string;
  support_email: string;
  support_available: boolean;
}

@Component({
  selector: 'app-support-center',
  templateUrl: './support-center.page.html',
  styleUrls: ['./support-center.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class SupportCenterPage {
  readonly role: SupportRole;
  readonly backRoute: string;

  readonly categoryCatalogs: Record<SupportRole, SupportCategory[]> = {

    // ─── BUYER ────────────────────────────────────────────────────────────────
    // Buyer places orders, pays for them, and receives the delivery personally.
    buyer: [
      {
        // Buyer pays via card/UPI — full failure chain applies.
        id: 'payment', icon: 'card-outline',
        options: ['failed', 'pending', 'deducted', 'mismatch', 'duplicate', 'refund', 'other']
      },
      {
        // Buyer places and tracks their own orders.
        // Removed: 'cancelled' / 'cancel' — cancelling an order is a trivial,
        // self-serve action; it doesn't need a support contact flow.
        id: 'order', icon: 'document-text-outline',
        options: ['missing', 'confirmation', 'status', 'stuck', 'incorrect', 'other']
      },
      {
        // Buyer is the one waiting for and receiving the delivery.
        // Removed: 'unavailable' (buyer IS the recipient, not a third party),
        //          'cannot-complete' (driver's problem not the buyer's),
        //          'confirmation' (platform-side, not buyer-actionable).
        id: 'delivery', icon: 'car-outline',
        options: ['delayed', 'not-arrived', 'not-contactable', 'address', 'not-received', 'other']
      },
      {
        // Buyer inspects goods on receipt.
        id: 'goods', icon: 'cube-outline',
        options: ['damaged', 'spoiled', 'wrong', 'missing', 'shortage', 'quality', 'does-not-match', 'other']
      },
      {
        // Buyer's issues with the wholesaler they ordered from.
        // Removed: 'not-responding' (buyer has no direct contact with wholesaler),
        //          'pickup-delayed' (invisible to buyer — they see delivery delayed, not pickup),
        //          'dispute' (too vague; specific issues below cover real scenarios),
        //          'not-processed' (buyer can't see wholesaler-side processing status),
        //          'cancelled' (trivial/self-serve, not a support issue),
        //          'price' (price is fixed and confirmed at checkout, not a recurring issue).
        id: 'seller', icon: 'storefront-outline',
        options: ['incorrect-supply', 'other']
      },
      {
        // Removed: 'business' — buyers are individuals, not registered businesses.
        id: 'account', icon: 'person-outline',
        options: ['login', 'otp', 'blocked', 'update', 'verification', 'security', 'other']
      },
      {
        // checkout / place-order / history are buyer-specific app flows.
        id: 'technical', icon: 'alert-circle-outline',
        options: ['crash', 'not-loading', 'button', 'checkout', 'place-order', 'history', 'workflow', 'error', 'other']
      },
      {
        id: 'safety', icon: 'warning-outline',
        options: ['emergency', 'unauthorized-payment', 'suspicious-transaction', 'unauthorized-order', 'account-activity', 'fraud', 'other']
      },
      {
        id: 'other', icon: 'help-circle-outline',
        options: ['general', 'previous-resolution', 'other']
      }
    ],

    // ─── WHOLESALER ───────────────────────────────────────────────────────────
    // Wholesaler lists products, receives orders from buyers, packs goods,
    // and hands them off to a driver. They never interact with buyers directly.
    wholesaler: [
      {
        // Wholesaler receives payouts, not card payments.
        // Removed: 'refund' (they sell, not buy — there is nothing to refund),
        //          'mismatch' — shared the 'payment' category id with buyer,
        //          so it inherited buyer's "Amount charged does not match
        //          the order" wording, which is wrong POV and redundant
        //          with 'payout-error' anyway.
        // Renamed 'pending' → 'payout-pending' for the same reason: shared
        // 'pending' key resolved to buyer's "Payment is stuck in pending
        // state" text. Driver's payment category reuses this same new key.
        id: 'payment', icon: 'card-outline',
        options: ['payout-pending', 'payout-error', 'dispute', 'other']
      },
      {
        // Wholesaler RECEIVES orders — they don't place them.
        // The flow is: buyer places order → it appears in wholesaler's dashboard.
        // Removed: 'auto-cancelled' (cancellation is trivial/self-resolving,
        //          doesn't need a support contact),
        //          'cannot-complete' (order completion is a system-driven,
        //          automatic process — not something the wholesaler manually does).
        id: 'incoming-order', icon: 'document-text-outline',
        options: ['not-appearing', 'details-incorrect', 'status-unclear', 'other']
      },
      {
        // Wholesaler packs goods and waits for the driver to pick them up.
        // Merged 'not-picked-up' into 'driver-not-arrived' — same underlying
        // issue from the wholesaler's point of view, kept as one option.
        // Removed: 'cannot-complete' (vague catch-all, already covered by
        //          the specific options above plus 'other').
        id: 'dispatch', icon: 'send-outline',
        options: ['driver-not-arrived', 'pickup-delayed', 'address', 'other']
      },
      {
        // Wholesaler's account on the platform — 'business' kept here since
        // wholesalers ARE registered businesses (unlike buyers).
        id: 'account', icon: 'person-outline',
        options: ['login', 'otp', 'blocked', 'update', 'business', 'verification', 'security', 'other']
      },
      {
        // 'stock' covers inventory/listing management in the wholesaler dashboard.
        id: 'technical', icon: 'alert-circle-outline',
        options: ['crash', 'not-loading', 'button', 'stock', 'listing', 'workflow', 'error', 'other']
      },
      {
        id: 'safety', icon: 'warning-outline',
        options: ['emergency', 'suspicious-transaction', 'fraud', 'other']
      },
      {
        id: 'other', icon: 'help-circle-outline',
        options: ['general', 'previous-resolution', 'other']
      }
    ],

    // ─── DRIVER ───────────────────────────────────────────────────────────────
    // Driver picks up goods from the wholesaler and delivers them to the buyer.
    driver: [
      {
        // Driver earns per trip — issues are about earnings, not purchases.
        // Removed: 'mismatch' — was worded as "amount charged doesn't match
        // the order", which is buyer/purchase language and doesn't fit a
        // driver's earnings context. 'deduction' already covers incorrect
        // earnings/payout scenarios with driver-appropriate wording.
        // Renamed 'pending' → 'payout-pending' — shared the 'pending' key
        // (and its buyer-worded "Payment is stuck in pending state" text)
        // with buyer's payment category. Shares the new key with wholesaler,
        // since "payout stuck pending" is correct for both.
        id: 'payment', icon: 'card-outline',
        options: ['payout-pending', 'deduction', 'other']
      },
      {
        // Trip assignment issues — before the driver even starts moving.
        // Removed: 'wrong-assignment'.
        id: 'trip', icon: 'navigate-outline',
        options: ['request-missing', 'cannot-accept', 'breakdown', 'other']
      },
      {
        // Issues during the actual delivery run.
        // 'goods-not-ready' covers wholesaler not having the package ready at pickup.
        // Removed: 'not-contactable' (was mislabeled "unable to contact the
        //          driver" — nonsensical, since the driver is the one filling
        //          out this form),
        //          'cannot-complete' ("unable to complete the delivery" — too
        //          vague, already covered by the specific options above),
        //          'confirmation' ("delivery confirmation not registering" —
        //          a technical/system issue, not a dedicated flow).
        id: 'delivery', icon: 'car-outline',
        options: ['pickup-delayed', 'goods-not-ready', 'customer-absent', 'address', 'other']
      },
      {
        // Goods in the driver's custody between pickup and drop-off.
        // Merged 'spoiled' into 'damaged' — kept one option per instruction
        // (swap to 'spoiled' instead if that fits your goods mix better).
        // Renamed 'shortage' → 'pickup-shortage': translation keys resolve
        // as OPTIONS.<category.id>.<option>, and driver shares the 'goods'
        // category id with buyer, so reusing 'shortage' would reuse buyer's
        // translation string too ("Quantity received is less than ordered"
        // — wrong POV for a driver, who picks up rather than receives).
        // Add SUPPORT_CENTER.OPTIONS.goods.pickup-shortage to the i18n
        // files with driver-correct copy, e.g. "Quantity picked up is less
        // than ordered".
        id: 'goods', icon: 'cube-outline',
        options: ['damaged', 'missing', 'pickup-shortage', 'other']
      },
      {
        // 'documents' covers license/vehicle/RC uploads, essential for drivers.
        // Removed: 'business' — drivers are individuals, not businesses.
        id: 'account', icon: 'person-outline',
        options: ['login', 'otp', 'blocked', 'update', 'verification', 'documents', 'security', 'other']
      },
      {
        // Removed: 'navigation' (maps/GPS issue).
        id: 'technical', icon: 'alert-circle-outline',
        options: ['crash', 'not-loading', 'trip-status', 'workflow', 'error', 'other']
      },
      {
        // 'accident' is the most driver-relevant safety scenario.
        id: 'safety', icon: 'warning-outline',
        options: ['emergency', 'accident', 'lost-package', 'fraud', 'other']
      },
      {
        id: 'other', icon: 'help-circle-outline',
        options: ['general', 'previous-resolution', 'other']
      }
    ]
  };

  readonly categories: SupportCategory[];

  selectedCategory: SupportCategory | null = null;
  selectedOption = '';
  description = '';
  supportPhone = '';
  supportEmail = 'support@go4u.app';

  constructor(
    private route: ActivatedRoute,
    private translate: TranslateService,
    private http: HttpClient,
    private callService: CallService
  ) {
    // Normalise legacy 'transport' route data to 'driver' so existing routes
    // keep working without needing an immediate router change.
    const rawRole = this.route.snapshot.data['role'] as string;
    this.role = (rawRole === 'transport' ? 'driver' : rawRole) as SupportRole || 'buyer';
    this.backRoute = {
      buyer: '/buyer/settings',
      wholesaler: '/wholesaler/settings',
      driver: '/transport/settings'
    }[this.role];
    this.categories = this.categoryCatalogs[this.role] ?? this.categoryCatalogs['buyer'];
    addIcons({
      alertCircleOutline, arrowBackOutline, callOutline, cardOutline,
      checkmarkCircleOutline, chevronForwardOutline, cubeOutline, documentTextOutline,
      helpCircleOutline, mailOutline, personOutline, storefrontOutline, carOutline,
      warningOutline, navigateOutline, sendOutline
    });
  }

  ngOnInit(): void {
    this.http.get<SupportContactResponse>(`${environment.apiUrl}/support/contact`).subscribe({
      next: (contact) => {
        this.supportPhone = contact.support_phone || '';
        this.supportEmail = contact.support_email || this.supportEmail;
      },
      error: () => {
        this.supportPhone = '';
      }
    });
  }

  selectCategory(category: SupportCategory): void {
    this.selectedCategory = category;
    this.selectedOption = '';
  }

  clearSelection(): void {
    this.selectedCategory = null;
    this.selectedOption = '';
    this.description = '';
  }

  get canContact(): boolean {
    return Boolean(this.selectedCategory && this.selectedOption);
  }

  callSupport(): void {
    void this.callService.placeCall(this.translate.instant('SUPPORT_CENTER.TITLE'), this.supportPhone);
  }

  emailSupport(): void {
    const category = this.selectedCategory?.id || 'other';
    const issue = this.selectedOption || 'other';
    const subject = this.translate.instant(`SUPPORT_CENTER.CATEGORIES.${category}.TITLE`);
    const body = [
      `Role: ${this.translate.instant(`SUPPORT_CENTER.ROLES.${this.role}`)}`,
      `Category: ${subject}`,
      `Issue: ${this.translate.instant(`SUPPORT_CENTER.OPTIONS.${category}.${issue}`)}`,
      `Description: ${this.description.trim() || '-'}`
    ].join('\n');
    window.location.href = `mailto:${this.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}