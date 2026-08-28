import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, bookOutline, bulbOutline, cartOutline, cashOutline,
  checkmarkCircleOutline, chevronForwardOutline, closeOutline, cubeOutline,
  documentTextOutline, helpCircleOutline, languageOutline, listOutline,
  personOutline, receiptOutline, refreshOutline, searchOutline, settingsOutline,
  shieldCheckmarkOutline, storefrontOutline, timeOutline, carOutline, speedometerOutline
} from 'ionicons/icons';

type HelpRole = 'buyer' | 'wholesaler' | 'transport';

interface HelpCard {
  id: string;
  category: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-help-center',
  templateUrl: './help-center.page.html',
  styleUrls: ['./help-center.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, TranslatePipe]
})
export class HelpCenterPage {
  readonly role: HelpRole;
  readonly backRoute: string;
  readonly cards: HelpCard[];
  activeCategory = 'all';
  showWalkthrough = false;
  walkthroughStep = 0;

  private readonly catalogs: Record<HelpRole, HelpCard[]> = {
    buyer: [
      { id: 'browse', category: 'shopping', icon: 'search-outline', route: '/buyer/buyer-home' },
      { id: 'cart', category: 'shopping', icon: 'cart-outline', route: '/buyer/cart' },
      { id: 'orders', category: 'orders', icon: 'receipt-outline', route: '/buyer/retailer-order-history' },
      { id: 'issues', category: 'support', icon: 'help-circle-outline', route: '/buyer/my-issues' },
      { id: 'business', category: 'account', icon: 'storefront-outline', route: '/buyer/business-info' },
      { id: 'locations', category: 'account', icon: 'language-outline', route: '/buyer/business-locations' }
    ],
    wholesaler: [
      { id: 'stock', category: 'stock', icon: 'cube-outline', route: '/wholesaler/stock-dashboard' },
      { id: 'orders', category: 'orders', icon: 'receipt-outline', route: '/wholesaler/orders' },
      { id: 'pickup', category: 'orders', icon: 'car-outline', route: '/wholesaler/pickup-orders' },
      { id: 'restocking', category: 'insights', icon: 'bulb-outline', route: '/wholesaler/restocking-recommendations' },
      { id: 'market', category: 'insights', icon: 'list-outline', route: '/wholesaler/market-opportunities' },
      { id: 'earnings', category: 'insights', icon: 'cash-outline', route: '/wholesaler/earnings' },
      { id: 'issues', category: 'support', icon: 'help-circle-outline', route: '/wholesaler/my-issues' }
    ],
    transport: [
      { id: 'onboarding', category: 'getting-started', icon: 'document-text-outline', route: '/transport/driver-registration' },
      { id: 'requests', category: 'deliveries', icon: 'list-outline', route: '/transport/transport-requests' },
      { id: 'pickup', category: 'deliveries', icon: 'cube-outline', route: '/transport/pickup-orders' },
      { id: 'delivery', category: 'deliveries', icon: 'checkmark-circle-outline', route: '/transport/delivery-confirmation' },
      { id: 'dashboard', category: 'deliveries', icon: 'speedometer-outline', route: '/transport/transport-dashboard' },
      { id: 'history', category: 'earnings', icon: 'time-outline', route: '/transport/delivery-history' },
      { id: 'earnings', category: 'earnings', icon: 'cash-outline', route: '/transport/earnings-dashboard' },
      { id: 'issues', category: 'support', icon: 'help-circle-outline', route: '/transport/my-issues' }
    ]
  };

  constructor(private route: ActivatedRoute, private router: Router) {
    const requestedRole = this.route.snapshot.data['role'] as HelpRole;
    this.role = requestedRole || 'buyer';
    this.backRoute = {
      buyer: '/buyer/settings',
      wholesaler: '/wholesaler/settings',
      transport: '/transport/settings'
    }[this.role];
    this.cards = this.catalogs[this.role];
    addIcons({
      arrowBackOutline, bookOutline, bulbOutline, cartOutline, cashOutline,
      checkmarkCircleOutline, chevronForwardOutline, closeOutline, cubeOutline,
      documentTextOutline, helpCircleOutline, languageOutline, listOutline,
      personOutline, receiptOutline, refreshOutline, searchOutline, settingsOutline,
      shieldCheckmarkOutline, storefrontOutline, timeOutline, carOutline, speedometerOutline
    });

    if (!localStorage.getItem(this.getWalkthroughKey())) {
      this.showWalkthrough = true;
    }
  }

  private readonly walkthroughCatalog: Record<HelpRole, string[]> = {
    buyer: ['welcome', 'browse', 'cart', 'orders'],
    wholesaler: ['welcome', 'stock', 'orders', 'pickup'],
    transport: ['welcome', 'onboarding', 'requests', 'pickup', 'delivery']
  };

  get categories(): string[] {
    return ['all', ...Array.from(new Set(this.cards.map(card => card.category)))];
  }

  get visibleCards(): HelpCard[] {
    return this.activeCategory === 'all'
      ? this.cards
      : this.cards.filter(card => card.category === this.activeCategory);
  }

  get walkthroughKeys(): string[] {
    return this.walkthroughCatalog[this.role] || ['welcome', ...this.cards.slice(0, 3).map(card => card.id)];
  }

  setCategory(category: string): void {
    this.activeCategory = category;
  }

  openCard(card: HelpCard): void {
    if (card.route) {
      this.router.navigateByUrl(this.router.createUrlTree([card.route], {
        queryParams: { returnTo: this.router.url }
      }), { state: { helpReturnUrl: this.router.url } });
    }
  }

  nextWalkthrough(): void {
    if (this.walkthroughStep < this.walkthroughKeys.length - 1) {
      this.walkthroughStep += 1;
      return;
    }
    this.closeWalkthrough();
  }

  closeWalkthrough(): void {
    localStorage.setItem(this.getWalkthroughKey(), 'true');
    this.showWalkthrough = false;
    this.walkthroughStep = 0;
  }

  replayWalkthrough(): void {
    this.walkthroughStep = 0;
    this.showWalkthrough = true;
  }

  private getWalkthroughKey(): string {
    return `help-center-walkthrough-${this.role}`;
  }
}