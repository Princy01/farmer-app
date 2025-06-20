// customer-chat.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack, storefront, call, ellipsisVertical, carOutline, location,
  locationOutline, timeOutline, checkmarkCircleOutline, informationCircle,
  checkmarkDone, checkmark, addCircle, mic, stopCircle, send, close,
  camera, image, documentText, shareOutline
} from 'ionicons/icons';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'driver' | 'customer';
  timestamp: Date;
  delivered?: boolean;
  type?: 'text' | 'voice' | 'image' | 'location';
}

@Component({
  selector: 'app-customer-chat',
  standalone: true,
  templateUrl: './customer-chat.component.html',
  styleUrls: ['./customer-chat.component.scss'],
  imports: [IonicModule, FormsModule, CommonModule]
})
export class CustomerChatComponent implements OnInit, OnDestroy {
  orderId: string = '';
  customerName: string = '';
  customerPhone: string = '';
  newMessage: string = '';
  messages: ChatMessage[] = [];
  isCustomerTyping: boolean = false;
  showAttachmentSheet: boolean = false;
  showVoiceModal: boolean = false;
  isRecording: boolean = false;
  recordingDuration: number = 0;
  recordingInterval: any;

  attachmentButtons = [
    {
      text: 'Take Photo',
      icon: 'camera',
      handler: () => this.takePhoto()
    },
    {
      text: 'Send Image',
      icon: 'image',
      handler: () => this.selectImage()
    },
    {
      text: 'Share Location',
      icon: 'location',
      handler: () => this.shareLocation()
    },
    {
      text: 'Send Document',
      icon: 'document-text',
      handler: () => this.selectDocument()
    },
    {
      text: 'Cancel',
      icon: 'close',
      role: 'cancel'
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      chevronBack, storefront, call, ellipsisVertical, carOutline, location,
      locationOutline, timeOutline, checkmarkCircleOutline, informationCircle,
      checkmarkDone, checkmark, addCircle, mic, stopCircle, send, close,
      camera, image, documentText, shareOutline
    });

    // Get navigation data
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.orderId = navigation.extras.state['orderId'] || '123456';
      this.customerName = navigation.extras.state['customerName'] || 'Customer';
      this.customerPhone = navigation.extras.state['customerPhone'] || '+91 98765 43210';
    }
  }

  ngOnInit() {
    this.initializeChat();
    this.simulateCustomerTyping();
  }

  ngOnDestroy() {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }
  }

  initializeChat() {
    // Add some initial messages
    this.messages = [
      {
        id: '1',
        content: 'Hello! I am your delivery driver for today. Your fresh mandi products are on the way!',
        sender: 'driver',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        delivered: true
      },
      {
        id: '2',
        content: 'Great! How long will it take to reach?',
        sender: 'customer',
        timestamp: new Date(Date.now() - 240000) // 4 minutes ago
      },
      {
        id: '3',
        content: 'I will be there in about 15 minutes. I will call you when I arrive.',
        sender: 'driver',
        timestamp: new Date(Date.now() - 180000), // 3 minutes ago
        delivered: true
      }
    ];
  }

  simulateCustomerTyping() {
    // Simulate customer typing occasionally
    setTimeout(() => {
      this.isCustomerTyping = true;
      setTimeout(() => {
        this.isCustomerTyping = false;
        // Add a customer message
        this.addMessage('Thanks for the update! I will be ready.', 'customer');
      }, 3000);
    }, 5000);
  }

  goBack() {
    this.router.navigate(['/transport/delivery-confirmation', this.orderId]);
  }

  makeCall() {
    window.open(`tel:${this.customerPhone}`, '_system');
  }

  async showMoreOptions() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'More Options',
      buttons: [
        {
          text: 'View Order Details',
          icon: 'receipt',
          handler: () => this.viewOrderDetails()
        },
        {
          text: 'Share Live Location',
          icon: 'navigate',
          handler: () => this.shareLocation()
        },
        {
          text: 'Report Issue',
          icon: 'warning',
          handler: () => this.reportIssue()
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  sendMessage(event?: Event) {
  // Cast the event to KeyboardEvent when needed
  if (event && event instanceof KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
    } else {
      return;
    }
  } else if (event) {
    return;
  }

  if (this.newMessage.trim()) {
    this.addMessage(this.newMessage.trim(), 'driver');
    this.newMessage = '';
  }
}

  sendQuickMessage(message: string) {
    this.addMessage(message, 'driver');
  }

  addMessage(content: string, sender: 'driver' | 'customer') {
    const message: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      delivered: sender === 'driver' ? false : undefined
    };

    this.messages.push(message);

    // Simulate message delivery for driver messages
    if (sender === 'driver') {
      setTimeout(() => {
        message.delivered = true;
      }, 1000);
    }

    // Scroll to bottom
    setTimeout(() => {
      const content = document.querySelector('ion-content');
      if (content) {
        content.scrollToBottom(300);
      }
    }, 100);
  }

  showAttachmentOptions() {
    this.showAttachmentSheet = true;
  }

  async takePhoto() {
    const toast = await this.toastCtrl.create({
      message: 'Photo captured and sent!',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    this.addMessage('📷 Photo: Current location', 'driver');
  }

  async selectImage() {
    const toast = await this.toastCtrl.create({
      message: 'Image sent!',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    this.addMessage('🖼️ Image: Product quality check', 'driver');
  }

  async shareLocation() {
    const toast = await this.toastCtrl.create({
      message: 'Live location shared!',
      duration: 2000,
      color: 'primary'
    });
    await toast.present();
    this.addMessage('📍 Live location shared - Track my arrival', 'driver');
  }

  async selectDocument() {
    const toast = await this.toastCtrl.create({
      message: 'Document sent!',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    this.addMessage('📄 Document: Delivery receipt', 'driver');
  }

  startVoiceMessage() {
    this.showVoiceModal = true;
    this.isRecording = true;
    this.recordingDuration = 0;

    this.recordingInterval = setInterval(() => {
      this.recordingDuration++;
    }, 1000);
  }

  cancelVoiceMessage() {
    this.isRecording = false;
    this.showVoiceModal = false;
    this.recordingDuration = 0;
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }
  }

  async sendVoiceMessage() {
    this.isRecording = false;
    this.showVoiceModal = false;
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }

    const duration = this.formatDuration(this.recordingDuration);
    this.addMessage(`🎙️ Voice message (${duration})`, 'driver');
    this.recordingDuration = 0;

    const toast = await this.toastCtrl.create({
      message: 'Voice message sent!',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  viewOrderDetails() {
    // Navigate to order details or show modal
    console.log('View order details');
  }

  async reportIssue() {
    const alert = await this.alertCtrl.create({
      header: 'Report Issue',
      message: 'What issue are you experiencing?',
      inputs: [
        {
          name: 'issue',
          type: 'textarea',
          placeholder: 'Describe the issue...'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Send Report',
          handler: async (data) => {
            const toast = await this.toastCtrl.create({
              message: 'Issue reported to support team!',
              duration: 2000,
              color: 'warning'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }
}