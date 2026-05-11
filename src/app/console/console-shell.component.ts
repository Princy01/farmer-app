import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  buildOutline,
  cardOutline,
  cashOutline,
  keyOutline,
  peopleOutline,
  pulseOutline,
  speedometerOutline,
} from 'ionicons/icons';

type ConsoleRole = 'admin' | 'ops' | 'finance';

interface ConsoleMenuItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-console-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
    IonRouterOutlet,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './console-shell.component.html',
  styleUrls: ['./console-shell.component.scss'],
})
export class ConsoleShellComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  protected readonly consoleRole: ConsoleRole;
  protected readonly menuItems: ConsoleMenuItem[];
  protected activeRoute = '';
  protected pageTitle = '';

  private readonly menuItemsByRole: Record<ConsoleRole, ConsoleMenuItem[]> = {
    admin: [
      { label: 'Control Tower', path: '/admin/control-tower', icon: 'speedometer-outline' },
      { label: 'Master Data', path: '/admin/master-data', icon: 'build-outline' },
      { label: 'Console Access', path: '/admin/console-access', icon: 'key-outline' },
      { label: 'Onboarding Watch', path: '/admin/onboarding-watch', icon: 'people-outline' },
      { label: 'Transport Watch', path: '/admin/transport-watch', icon: 'pulse-outline' },
      { label: 'Payment Watch', path: '/admin/payment-watch', icon: 'cash-outline' },
    ],
    ops: [
      { label: 'Ops Dashboard', path: '/ops/dashboard', icon: 'speedometer-outline' },
      { label: 'Onboarding Watch', path: '/ops/onboarding-watch', icon: 'people-outline' },
      { label: 'Transport Watch', path: '/ops/transport-watch', icon: 'pulse-outline' },
    ],
    finance: [
      { label: 'Finance Dashboard', path: '/finance/dashboard', icon: 'speedometer-outline' },
      { label: 'Payment Watch', path: '/finance/payment-watch', icon: 'card-outline' },
    ],
  };

  private readonly titleMap: Record<string, string> = {
    '/admin/control-tower': 'Control Tower',
    '/admin/master-data': 'Master Data',
    '/admin/console-access': 'Console Access',
    '/admin/onboarding-watch': 'Onboarding Watch',
    '/admin/transport-watch': 'Transport Watch',
    '/admin/payment-watch': 'Payment Watch',
    '/ops/dashboard': 'Ops Dashboard',
    '/ops/onboarding-watch': 'Onboarding Watch',
    '/ops/transport-watch': 'Transport Watch',
    '/finance/dashboard': 'Finance Dashboard',
    '/finance/payment-watch': 'Payment Watch',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    addIcons({
      buildOutline,
      cardOutline,
      cashOutline,
      keyOutline,
      peopleOutline,
      pulseOutline,
      speedometerOutline,
    });

    const routeRole = this.route.snapshot.data['consoleRole'] as ConsoleRole | undefined;
    this.consoleRole = routeRole ?? 'admin';
    this.menuItems = this.menuItemsByRole[this.consoleRole];
    this.activeRoute = this.router.url;
    this.pageTitle = this.resolvePageTitle(this.activeRoute);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        this.activeRoute = event.urlAfterRedirects;
        this.pageTitle = this.resolvePageTitle(this.activeRoute);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected isActive(route: string): boolean {
    return this.activeRoute.startsWith(route);
  }

  protected getConsoleLabel(): string {
    switch (this.consoleRole) {
      case 'ops':
        return 'Ops Console';
      case 'finance':
        return 'Finance Console';
      default:
        return 'Admin Console';
    }
  }

  private resolvePageTitle(url: string): string {
    for (const item of this.menuItems) {
      if (url.startsWith(item.path)) {
        return this.titleMap[item.path] ?? item.label;
      }
    }
    return this.getConsoleLabel();
  }
}
