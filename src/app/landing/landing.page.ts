import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule, IonContent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  businessOutline,
  carOutline,
  cartOutline,
  chevronForwardOutline,
  cubeOutline,
  locationOutline,
  logoAppleAppstore,
  logoGooglePlaystore,
  peopleOutline,
  searchOutline,
  shieldCheckmarkOutline,
  statsChartOutline,
  storefrontOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';

export type Language = 'en' | 'hi';

/**
 * Flat illustrated scene backgrounds for role cards matching your design:
 * Wholesaler (boxes/crates), Retailer (shop/awning), Driver (truck).
 * Accents match the exact landing page theme colors.
 */
function buildRoleScene(role: 'wholesaler' | 'retailer' | 'driver'): string {
  const base = '#0f1218';
  let shapes = '';

  if (role === 'wholesaler') {
    // Full-width structured warehouse crates/boxes spanning the top header
    const c = '#5b73e8';
    shapes = `
      <rect x="20" y="40" width="90" height="110" rx="4" fill="${c}" opacity="0.18"/>
      <line x1="20" y1="75" x2="110" y2="75" stroke="${base}" stroke-width="2" opacity="0.5"/>
      <line x1="65" y1="75" x2="65" y2="150" stroke="${base}" stroke-width="2" opacity="0.5"/>

      <rect x="125" y="20" width="105" height="130" rx="4" fill="${c}" opacity="0.22"/>
      <line x1="125" y1="60" x2="230" y2="60" stroke="${base}" stroke-width="2" opacity="0.5"/>
      <line x1="125" y1="105" x2="230" y2="105" stroke="${base}" stroke-width="2" opacity="0.5"/>

      <rect x="245" y="55" width="85" height="95" rx="4" fill="${c}" opacity="0.15"/>
      <line x1="245" y1="90" x2="330" y2="90" stroke="${base}" stroke-width="2" opacity="0.5"/>
    `;
  } else if (role === 'retailer') {
    // Full-width market shop awning stretching across the top
    const c = '#c9852a';
    shapes = `
      <rect x="0" y="15" width="320" height="20" fill="${c}" opacity="0.25"/>
      <polygon points="0,35 40,85 80,35" fill="${c}" opacity="0.2"/>
      <polygon points="80,35 120,85 160,35" fill="${c}" opacity="0.28"/>
      <polygon points="160,35 200,85 240,35" fill="${c}" opacity="0.2"/>
      <polygon points="240,35 280,85 320,35" fill="${c}" opacity="0.28"/>
      <rect x="30" y="95" width="260" height="55" rx="6" fill="${c}" opacity="0.12"/>
    `;
  } else {
    // Delivery truck driving across a full-width road banner at the top
    const c = '#56744c';
    shapes = `
      <rect x="50" y="45" width="130" height="65" rx="6" fill="${c}" opacity="0.2"/>
      <path d="M180 65 L225 65 L260 95 L260 110 L180 110 Z" fill="${c}" opacity="0.25"/>
      <rect x="195" y="75" width="35" height="22" rx="2" fill="${base}" opacity="0.6"/>
      <!-- Wheels -->
      <circle cx="95" cy="110" r="14" fill="${base}"/>
      <circle cx="95" cy="110" r="14" fill="${c}" opacity="0.35"/>
      <circle cx="225" cy="110" r="14" fill="${base}"/>
      <circle cx="225" cy="110" r="14" fill="${c}" opacity="0.35"/>
      <!-- Road line -->
      <line x1="0" y1="126" x2="320" y2="126" stroke="${c}" stroke-width="3" stroke-dasharray="16 16" opacity="0.3"/>
    `;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" preserveAspectRatio="none">` +
    `<rect width="320" height="160" fill="${base}"/>` +
    shapes +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

interface RoleBullet {
  icon: string;
  text: string;
}

interface RoleCard {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  routeLabel: string;
  pattern: string;
  bullets: RoleBullet[];
}

interface CapabilityCard {
  title: string;
  description: string;
  icon: string;
}

interface StepCard {
  step: string;
  title: string;
  description: string;
}

interface PlatformFlow {
  label: string;
  value: string;
}

interface StatItem {
  value: string;
  suffix: string;
  label: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage {
  @ViewChild(IonContent, { static: true }) private readonly content!: IonContent;

  protected currentLang: Language = 'en';
  protected readonly currentYear = new Date().getFullYear();

  protected readonly translations = {
    en: {
      'nav.roles': 'Roles',
      'nav.platform': 'Platform',
      'nav.flow': 'Flow',
      'nav.start': 'Get started',
      'brand.tag': 'Indian agri marketplace',
      'hero.eyebrow': 'A platform for agricultural trade in India',
      'hero.h1': 'Wholesale, retail and delivery, working from the same platform.',
      'hero.text':
        'Melato brings wholesalers, retailers and delivery partners together, so trade that used to run across phone calls and spreadsheets can run in one place instead.',
      'hero.cta1': 'Sign up or log in',
      'hero.cta2': 'See how it works',
      'hero.proof': 'Every wholesaler, retailer and driver on Melato is verified.',
      'snapshot.label': 'Platform snapshot',
      'snapshot.h2': 'One platform, three roles',
      'mini.1': 'Built to help partner teams stay in sync',
      'mini.2': 'One account per business, kept up to date',
      'mini.3': 'Delivery status that is easy to follow',
      'trust.kicker': 'Why Melato',
      'trust.h2': 'Trade breaks down when it lives in too many places.',
      'trust.p':
        'A phone call for the order, a paper ledger for the payment, another call to check on the delivery. Melato keeps wholesalers, retailers and drivers on one shared record, so nothing gets lost in between.',
      'roles.kicker': 'Built for three kinds of partners',
      'roles.h2': 'Each partner gets an experience suited to their work.',
      'platform.kicker': 'What you get',
      'platform.h2': 'Same platform, fewer moving parts.',
      'flow.kicker': 'How a trade moves through Melato',
      'flow.h2': 'From the first order to the final delivery.',
      'cta.kicker': 'Ready when you are',
      'cta.h2': 'Get started with Melato and go straight to the right role.',
      'cta.p': "Whichever role you're in, the next step is one click away.",
      'cta.button1': 'Sign up',
      'cta.reviewroles': 'Review roles',
      'cta.loginprompt': 'Already using Melato?',
      'cta.button2': 'Log in',
      'cta.appnote': 'Prefer the app? Get Melato on your phone.',
      'store.getiton': 'Get it on',
      'store.downloadon': 'Download on the',
      'footer.copyright': "Melato. Built for India's agricultural trade.",
    },
    hi: {
      'nav.roles': 'भूमिकाएं',
      'nav.platform': 'प्लेटफॉर्म',
      'nav.flow': 'प्रक्रिया',
      'nav.start': 'शुरू करें',
      'brand.tag': 'भारतीय कृषि बाज़ार',
      'hero.eyebrow': 'भारत में कृषि व्यापार के लिए एक प्लेटफॉर्म',
      'hero.h1': 'थोक, रिटेल और डिलीवरी, एक ही प्लेटफॉर्म से।',
      'hero.text':
        'Melato थोक व्यापारियों, रिटेलरों और डिलीवरी पार्टनर्स को साथ लाता है, ताकि जो व्यापार पहले फोन कॉल और रजिस्टरों में बिखरा रहता था, वह अब एक ही जगह से चल सके।',
      'hero.cta1': 'साइन अप या लॉग इन करें',
      'hero.cta2': 'यह कैसे काम करता है देखें',
      'hero.proof': 'Melato पर हर थोक व्यापारी, रिटेलर और ड्राइवर सत्यापित है।',
      'snapshot.label': 'प्लेटफॉर्म स्नैपशॉट',
      'snapshot.h2': 'एक प्लेटफॉर्म, तीन भूमिकाएं',
      'mini.1': 'पार्टनर टीमों को तालमेल में रखने के लिए बनाया गया',
      'mini.2': 'हर व्यापार का एक अकाउंट, हमेशा अद्यतित',
      'mini.3': 'डिलीवरी की स्थिति जो आसानी से समझ आती है',
      'trust.kicker': 'Melato क्यों',
      'trust.h2': 'बहुत जगह बिखरा व्यापार टूटने लगता है।',
      'trust.p':
        'ऑर्डर के लिए एक कॉल, भुगतान के लिए एक बहीखाता, और डिलीवरी का हाल जानने के लिए एक और कॉल। Melato थोक व्यापारियों, रिटेलरों और ड्राइवरों को एक साझा रिकॉर्ड पर रखता है, ताकि बीच में कुछ भी न छूटे।',
      'roles.kicker': 'तीन तरह के पार्टनर्स के लिए बनाया गया',
      'roles.h2': 'हर पार्टनर को उसके काम के अनुसार अनुभव मिलता है।',
      'platform.kicker': 'आपको क्या मिलता है',
      'platform.h2': 'एक ही प्लेटफ़ॉर्म, कम झंझट।',
      'flow.kicker': 'Melato में व्यापार कैसे आगे बढ़ता है',
      'flow.h2': 'पहले ऑर्डर से लेकर अंतिम डिलीवरी तक।',
      'cta.kicker': 'जब आप तैयार हों',
      'cta.h2': 'Melato शुरू करें और सीधे सही भूमिका तक पहुंचें।',
      'cta.p': 'आप जिस भी भूमिका में हैं, अगला कदम बस एक क्लिक दूर है।',
      'cta.button1': 'साइन अप करें',
      'cta.reviewroles': 'भूमिकाएं देखें',
      'cta.loginprompt': 'पहले से Melato पर हैं?',
      'cta.button2': 'लॉग इन करें',
      'cta.appnote': 'ऐप पसंद है? Melato अपने फोन पर डाउनलोड करें।',
      'store.getiton': 'यहां उपलब्ध',
      'store.downloadon': 'डाउनलोड करें',
      'footer.copyright': 'Melato. भारत के कृषि व्यापार के लिए बनाया गया।',
    },
  };

  protected readonly platformFlowsData: Record<Language, PlatformFlow[]> = {
    en: [
      { label: 'Retailer', value: 'Order and manage' },
      { label: 'Wholesaler', value: 'List and fulfill' },
      { label: 'Driver', value: 'Pickup and deliver' },
    ],
    hi: [
      { label: 'रिटेलर', value: 'ऑर्डर और प्रबंधन' },
      { label: 'थोक व्यापारी', value: 'लिस्टिंग और पूर्ति' },
      { label: 'ड्राइवर', value: 'पिकअप और डिलीवरी' },
    ],
  };

  protected readonly statsData: Record<Language, StatItem[]> = {
    en: [
      { value: '[XXX]', suffix: '+', label: 'Verified businesses' },
      { value: '[XXX]', suffix: '+', label: 'Orders processed' },
      { value: '[XX]', suffix: '', label: 'Cities covered' },
      { value: '[XX]', suffix: '%', label: 'On-time deliveries' },
    ],
    hi: [
      { value: '[XXX]', suffix: '+', label: 'सत्यापित व्यापार' },
      { value: '[XXX]', suffix: '+', label: 'प्रोसेस किए गए ऑर्डर' },
      { value: '[XX]', suffix: '', label: 'शहर' },
      { value: '[XX]', suffix: '%', label: 'समय पर डिलीवरी' },
    ],
  };

  protected readonly roleCardsData: Record<Language, RoleCard[]> = {
    en: [
      {
        title: 'Wholesalers',
        subtitle: 'A connected view of your business',
        description:
          'Manage listings and orders through one partner account, built around how wholesale trade actually runs.',
        icon: 'cube-outline',
        accent: '#5b73e8',
        routeLabel: 'Wholesaler access',
        pattern: buildRoleScene('wholesaler'),
        bullets: [
          { icon: 'stats-chart-outline', text: 'One screen for everything moving through your business.' },
          { icon: 'wallet-outline', text: 'Orders handled without switching between tools.' },
          { icon: 'business-outline', text: 'Business and location details kept current.' },
        ],
      },
      {
        title: 'Retailers',
        subtitle: 'Source with confidence',
        description:
          'Work with verified wholesale partners and keep purchasing organized in one account.',
        icon: 'cart-outline',
        accent: '#c9852a',
        routeLabel: 'Retailer access',
        pattern: buildRoleScene('retailer'),
        bullets: [
          { icon: 'search-outline', text: 'Find and order from verified partners without the back-and-forth.' },
          { icon: 'wallet-outline', text: 'Purchase history kept in one place.' },
          { icon: 'business-outline', text: 'Account and location details stay organized.' },
        ],
      },
      {
        title: 'Drivers',
        subtitle: 'A focused logistics view',
        description:
          'A dedicated experience for pickups and deliveries, built for use on the move.',
        icon: 'car-outline',
        accent: '#56744c',
        routeLabel: 'Driver access',
        pattern: buildRoleScene('driver'),
        bullets: [
          { icon: 'car-outline', text: "Today's pickups and deliveries, queued and ready." },
          { icon: 'shield-checkmark-outline', text: 'A defined handoff process at each stop.' },
          { icon: 'people-outline', text: 'Built for quick use in the field.' },
        ],
      },
    ],
    hi: [
      {
        title: 'थोक व्यापारी',
        subtitle: 'आपके व्यापार का पूरा दृश्य',
        description:
          'एक ही पार्टनर अकाउंट से लिस्टिंग और ऑर्डर प्रबंधित करें, जो थोक व्यापार के असल तरीके के अनुसार बनाया गया है।',
        icon: 'cube-outline',
        accent: '#5b73e8',
        routeLabel: 'थोक व्यापारी एक्सेस',
        pattern: buildRoleScene('wholesaler'),
        bullets: [
          { icon: 'stats-chart-outline', text: 'आपके पूरे कारोबार की गतिविधि, एक ही स्क्रीन पर।' },
          { icon: 'wallet-outline', text: 'बिना अलग टूल बदले ऑर्डर संभालना।' },
          { icon: 'business-outline', text: 'व्यापार और स्थान की जानकारी अद्यतित रहती है।' },
        ],
      },
      {
        title: 'रिटेलर',
        subtitle: 'भरोसे के साथ खरीद करें',
        description:
          'सत्यापित थोक पार्टनर्स के साथ काम करें और खरीद को एक अकाउंट में व्यवस्थित रखें।',
        icon: 'cart-outline',
        accent: '#c9852a',
        routeLabel: 'रिटेलर एक्सेस',
        pattern: buildRoleScene('retailer'),
        bullets: [
          { icon: 'search-outline', text: 'सत्यापित पार्टनर्स से खोजना और ऑर्डर करना, बिना किसी झंझट के।' },
          { icon: 'wallet-outline', text: 'खरीद का इतिहास एक स्थान पर।' },
          { icon: 'business-outline', text: 'अकाउंट और स्थान की जानकारी व्यवस्थित रहती है।' },
        ],
      },
      {
        title: 'ड्राइवर',
        subtitle: 'सुव्यवस्थित लॉजिस्टिक्स दृश्य',
        description:
          'पिकअप और डिलीवरी के लिए एक समर्पित अनुभव, चलते-फिरते उपयोग के लिए बनाया गया।',
        icon: 'car-outline',
        accent: '#56744c',
        routeLabel: 'ड्राइवर एक्सेस',
        pattern: buildRoleScene('driver'),
        bullets: [
          { icon: 'car-outline', text: 'आज के पिकअप और डिलीवरी, कतार में और तैयार।' },
          { icon: 'shield-checkmark-outline', text: 'हर पड़ाव पर एक तय हैंडऑफ प्रक्रिया।' },
          { icon: 'people-outline', text: 'फील्ड में तुरंत उपयोग के लिए बनाया गया।' },
        ],
      },
    ],
  };

  protected readonly capabilityCardsData: Record<Language, CapabilityCard[]> = {
    en: [
      {
        title: 'Operational visibility',
        description: "See what's happening across orders and deliveries, instead of piecing it together after a call.",
        icon: 'stats-chart-outline',
      },
      {
        title: 'Buying and selling in one place',
        description: 'Every order, from placed to fulfilled, stays inside the same account.',
        icon: 'wallet-outline',
      },
      {
        title: 'Accounts that stay organized',
        description: "Update a location or business detail once, and it's right everywhere else.",
        icon: 'location-outline',
      },
      {
        title: 'Logistics built in',
        description: "Delivery isn't a separate app bolted on — it's part of how orders move.",
        icon: 'car-outline',
      },
      {
        title: 'Built for Indian trade teams',
        description: "English and Hindi, because that's how trade actually happens in India.",
        icon: 'people-outline',
      },
    ],
    hi: [
      {
        title: 'परिचालन दृश्यता',
        description: 'ऑर्डर और डिलीवरी में क्या चल रहा है, यह कॉल किए बिना ही दिख जाए।',
        icon: 'stats-chart-outline',
      },
      {
        title: 'एक ही जगह खरीद-बिक्री',
        description: 'ऑर्डर देने से लेकर पूरा होने तक, सब कुछ एक ही अकाउंट में रहता है।',
        icon: 'wallet-outline',
      },
      {
        title: 'व्यवस्थित अकाउंट',
        description: 'लोकेशन या व्यापार विवरण एक बार अपडेट करें, हर जगह वही सही जानकारी दिखे।',
        icon: 'location-outline',
      },
      {
        title: 'अंतर्निहित लॉजिस्टिक्स',
        description: 'डिलीवरी कोई अलग जोड़ा हुआ फीचर नहीं — यह ऑर्डर के साथ ही चलती है।',
        icon: 'car-outline',
      },
      {
        title: 'भारतीय व्यापार टीमों के लिए',
        description: 'अंग्रेज़ी और हिंदी में, क्योंकि भारत में व्यापार असल में ऐसे ही होता है।',
        icon: 'people-outline',
      },
    ],
  };

  protected readonly stepsData: Record<Language, StepCard[]> = {
    en: [
      {
        step: '01',
        title: 'Onboard your business',
        description: 'Verified wholesalers, retailers and drivers are set up with the right role.',
      },
      {
        step: '02',
        title: 'Place and manage orders',
        description: 'Orders and business actions stay together in one partner account.',
      },
      {
        step: '03',
        title: 'Move it through delivery',
        description: 'Drivers stay connected to the handoff process end to end.',
      },
      {
        step: '04',
        title: 'Review and repeat',
        description: 'Reordering takes minutes once the first trade is done.',
      },
    ],
    hi: [
      {
        step: '01',
        title: 'अपना व्यापार जोड़ें',
        description: 'सत्यापित थोक व्यापारी, रिटेलर और ड्राइवर सही भूमिका के साथ सेटअप किए जाते हैं।',
      },
      {
        step: '02',
        title: 'ऑर्डर करें और प्रबंधित करें',
        description: 'ऑर्डर और व्यापार गतिविधियां एक ही पार्टनर अकाउंट में साथ रहती हैं।',
      },
      {
        step: '03',
        title: 'डिलीवरी तक पहुंचाएं',
        description: 'ड्राइवर शुरू से अंत तक हैंडऑफ प्रक्रिया से जुड़े रहते हैं।',
      },
      {
        step: '04',
        title: 'समीक्षा करें और दोहराएं',
        description: 'पहला ऑर्डर पूरा होते ही, दोबारा ऑर्डर करना बस कुछ मिनट का काम है।',
      },
    ],
  };

  constructor() {
    addIcons({
      analyticsOutline,
      businessOutline,
      carOutline,
      cartOutline,
      chevronForwardOutline,
      cubeOutline,
      locationOutline,
      logoAppleAppstore,
      logoGooglePlaystore,
      peopleOutline,
      searchOutline,
      shieldCheckmarkOutline,
      statsChartOutline,
      storefrontOutline,
      timeOutline,
      walletOutline,
    });
  }

  protected setLanguage(lang: Language): void {
    this.currentLang = lang;
  }

  protected t(key: keyof typeof this.translations['en']): string {
    return this.translations[this.currentLang][key] || this.translations['en'][key] || '';
  }

  protected get platformFlows(): PlatformFlow[] {
    return this.platformFlowsData[this.currentLang];
  }

  protected get stats(): StatItem[] {
    return this.statsData[this.currentLang];
  }

  protected get roleCards(): RoleCard[] {
    return this.roleCardsData[this.currentLang];
  }

  protected get capabilityCards(): CapabilityCard[] {
    return this.capabilityCardsData[this.currentLang];
  }

  protected get steps(): StepCard[] {
    return this.stepsData[this.currentLang];
  }

  protected async scrollToSection(event: Event, sectionId: string): Promise<void> {
    event.preventDefault();

    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    const scrollElement = await this.content.getScrollElement();
    const sectionTop = section.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top;
    const targetTop = Math.max(scrollElement.scrollTop + sectionTop - 24, 0);

    await this.content.scrollToPoint(0, targetTop, 450);
    window.history.replaceState(null, '', `#${sectionId}`);
  }
}