import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-console-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
  ],
  template: `
    <ion-content class="placeholder-content">
      <div class="placeholder-wrap">
        <ion-card class="placeholder-card">
          <ion-card-header>
            <ion-card-subtitle>{{ consoleLabel }}</ion-card-subtitle>
            <ion-card-title>{{ title }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ description }}</p>
            <p class="placeholder-note">Phase 1 is wired: auth, routing, guards, and shell navigation are ready.</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .placeholder-content {
      --background: #f5f7fb;
    }

    .placeholder-wrap {
      padding: 20px;
    }

    .placeholder-card {
      max-width: 720px;
      margin: 0 auto;
      border-radius: 20px;
      box-shadow: 0 18px 40px rgba(16, 40, 67, 0.08);
    }

    ion-card-subtitle {
      color: #47637d;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    ion-card-title {
      color: #15304d;
      font-size: 1.5rem;
    }

    p {
      color: #334e68;
      line-height: 1.6;
      margin: 0 0 12px;
    }

    .placeholder-note {
      margin-top: 18px;
      color: #1f4f73;
      font-weight: 600;
    }
  `],
})
export class ConsolePlaceholderComponent {
  protected readonly title: string;
  protected readonly description: string;
  protected readonly consoleLabel: string;

  constructor(private readonly route: ActivatedRoute) {
    const data = this.route.snapshot.data;
    this.title = data['title'] ?? 'Console';
    this.description = data['description'] ?? 'This page is ready for the next UI slice.';
    this.consoleLabel = data['consoleLabel'] ?? 'Console';
  }
}
