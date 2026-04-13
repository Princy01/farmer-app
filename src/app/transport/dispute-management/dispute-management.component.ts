import {
  Component, OnInit, OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonicModule, LoadingController,
  ToastController, AlertController
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  warningOutline, addCircleOutline, chevronBackOutline,
  documentTextOutline, timeOutline, checkmarkCircleOutline,
  closeCircleOutline, alertCircleOutline, hourglassOutline,
  attachOutline, cameraOutline, imageOutline, sendOutline,
  refreshOutline, locationOutline, carOutline, personOutline,
  helpCircleOutline, receiptOutline, listOutline,
  chevronForwardOutline, ellipsisVertical, cloudUploadOutline,
  trashOutline, eyeOutline
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { DisputeService, Dispute, CreateDisputeRequest, DisputeEvidence } from './dispute-management.service';

type ViewMode = 'list' | 'raise' | 'detail';

interface IssueTypeOption {
  code: string;
  label: string;
  icon: string;
  module: string;
}

@Component({
  selector: 'app-dispute-management',
  standalone: true,
  templateUrl: './dispute-management.component.html',
  styleUrls: ['./dispute-management.component.scss'],
  imports: [IonicModule, FormsModule, CommonModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DisputeManagementComponent implements OnInit {

  // View state
  view: ViewMode = 'list';
  activeTabIndex: number = 0; // 0 = open, 1 = resolved

  // List data  ─
  openDisputes: Dispute[] = [];
  resolvedDisputes: Dispute[] = [];
  isLoadingList: boolean = false;

  // Selected dispute (detail view)
  selectedDispute: Dispute | null = null;
  disputeEvidence: DisputeEvidence[] = [];
  isLoadingDetail: boolean = false;

  // Raise dispute form
  form = {
    issue_type_code: '',
    title: '',
    description: '',
    job_id: null as number | null,
    order_id: null as number | null,
    priority: 'medium',
    incident_at: '',
  };
  formErrors: Record<string, string> = {};
  isSubmitting: boolean = false;
  pendingFiles: File[] = [];
  pendingPreviews: string[] = [];

  // Issue type catalog (mirrors issue_types table)
  issueTypes: IssueTypeOption[] = [
    { code: 'damaged_goods',    label: 'TRANSPORT_DISPUTE.ISSUE_DAMAGED_GOODS', icon: 'warning-outline',       module: 'quality'  },
    { code: 'shortage',         label: 'TRANSPORT_DISPUTE.ISSUE_SHORTAGE',       icon: 'alert-circle-outline',  module: 'delivery' },
    { code: 'wrong_item',       label: 'TRANSPORT_DISPUTE.ISSUE_WRONG_ITEM',     icon: 'close-circle-outline',  module: 'delivery' },
    { code: 'late_delivery',    label: 'TRANSPORT_DISPUTE.ISSUE_LATE_DELIVERY',  icon: 'time-outline',          module: 'delivery' },
    { code: 'payment_mismatch', label: 'TRANSPORT_DISPUTE.ISSUE_PAYMENT_MISMATCH', icon: 'receipt-outline',     module: 'payment'  },
    { code: 'wrong_address',    label: 'TRANSPORT_DISPUTE.ISSUE_WRONG_ADDRESS',  icon: 'location-outline',      module: 'delivery' },
    { code: 'vehicle_breakdown',label: 'TRANSPORT_DISPUTE.ISSUE_VEHICLE_BREAKDOWN', icon: 'car-outline',        module: 'delivery' },
    { code: 'customer_absent',  label: 'TRANSPORT_DISPUTE.ISSUE_CUSTOMER_ABSENT', icon: 'person-outline',       module: 'delivery' },
    { code: 'other',            label: 'TRANSPORT_DISPUTE.ISSUE_OTHER',          icon: 'help-circle-outline',   module: 'delivery' },
  ];

  priorityOptions = [
    { value: 'low',      label: 'TRANSPORT_DISPUTE.PRIORITY_LOW',      color: 'success'  },
    { value: 'medium',   label: 'TRANSPORT_DISPUTE.PRIORITY_MEDIUM',   color: 'warning'  },
    { value: 'high',     label: 'TRANSPORT_DISPUTE.PRIORITY_HIGH',     color: 'danger'   },
    { value: 'critical', label: 'TRANSPORT_DISPUTE.PRIORITY_CRITICAL', color: 'dark'     },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private disputeService: DisputeService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private translate: TranslateService
  ) {
    addIcons({
      'warning-outline': warningOutline,
      'add-circle-outline': addCircleOutline,
      'chevron-back-outline': chevronBackOutline,
      'document-text-outline': documentTextOutline,
      'time-outline': timeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'alert-circle-outline': alertCircleOutline,
      'hourglass-outline': hourglassOutline,
      'attach-outline': attachOutline,
      'camera-outline': cameraOutline,
      'image-outline': imageOutline,
      'send-outline': sendOutline,
      'refresh-outline': refreshOutline,
      'location-outline': locationOutline,
      'car-outline': carOutline,
      'person-outline': personOutline,
      'help-circle-outline': helpCircleOutline,
      'receipt-outline': receiptOutline,
      'list-outline': listOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'ellipsis-vertical': ellipsisVertical,
      'cloud-upload-outline': cloudUploadOutline,
      'trash-outline': trashOutline,
      'eye-outline': eyeOutline,
    });
  }

  async ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    // Pre-fill job/order from route query params if coming from delivery flow
    const jobId = this.route.snapshot.queryParamMap.get('jobId');
    const orderId = this.route.snapshot.queryParamMap.get('orderId');
    if (jobId)   this.form.job_id   = +jobId;
    if (orderId) this.form.order_id = +orderId;

    await this.loadDisputes();
  }

  // Data loading

  async loadDisputes() {
    this.isLoadingList = true;
    try {
      const all = await this.disputeService.getMyDisputes().toPromise() || [];
      this.openDisputes     = all.filter(d => !['resolved','closed','cancelled'].includes(d.status));
      this.resolvedDisputes = all.filter(d =>  ['resolved','closed','cancelled'].includes(d.status));
    } catch {
      await this.showToast(this.translate.instant('TRANSPORT_DISPUTE.TOAST_LOAD_FAILED'), 'danger');
    } finally {
      this.isLoadingList = false;
    }
  }

  async openDetail(dispute: Dispute) {
    this.selectedDispute = dispute;
    this.view = 'detail';
    this.isLoadingDetail = true;
    try {
      this.disputeEvidence = await this.disputeService.getEvidence(dispute.id).toPromise() || [];
    } catch {
      this.disputeEvidence = [];
    } finally {
      this.isLoadingDetail = false;
    }
  }

  // Raise dispute

  startRaise() {
    this.resetForm();
    this.view = 'raise';
  }

  selectIssueType(code: string) {
    this.form.issue_type_code = code;
    if (this.formErrors['issue_type_code']) delete this.formErrors['issue_type_code'];
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      if (this.pendingFiles.length >= 5) return; // max 5
      this.pendingFiles.push(file);
      const reader = new FileReader();
      reader.onload = e => this.pendingPreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeFile(i: number) {
    this.pendingFiles.splice(i, 1);
    this.pendingPreviews.splice(i, 1);
  }

  validateForm(): boolean {
    this.formErrors = {};
    if (!this.form.issue_type_code) this.formErrors['issue_type_code'] = this.translate.instant('TRANSPORT_DISPUTE.ERROR_SELECT_ISSUE_TYPE');
    if (!this.form.description?.trim()) this.formErrors['description'] = this.translate.instant('TRANSPORT_DISPUTE.ERROR_DESCRIBE_ISSUE');
    return Object.keys(this.formErrors).length === 0;
  }

  async submitDispute() {
    if (!this.validateForm()) return;
    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('TRANSPORT_DISPUTE.LOADING_SUBMITTING') });
    await loading.present();

    try {
      const payload: CreateDisputeRequest = {
        issue_type_code: this.form.issue_type_code,
        title: this.form.title || this.translate.instant(this.getLabelForCode(this.form.issue_type_code)),
        description: this.form.description,
        priority: this.form.priority,
        source_channel: 'app',
        job_id: this.form.job_id || undefined,
        order_id: this.form.order_id || undefined,
        incident_at: this.form.incident_at || undefined,
      };
      const created = await this.disputeService.createDispute(payload).toPromise();
      if (created && this.pendingFiles.length > 0) {
        await this.disputeService.uploadEvidence(created.id, this.pendingFiles).toPromise();
      }
      await this.showToast(this.translate.instant('TRANSPORT_DISPUTE.TOAST_SUBMIT_SUCCESS'), 'success');
      await this.loadDisputes();
      if (created) await this.openDetail(created);
      else this.view = 'list';
    } catch {
      await this.showToast(this.translate.instant('TRANSPORT_DISPUTE.TOAST_SUBMIT_FAILED'), 'danger');
    } finally {
      this.isSubmitting = false;
      await loading.dismiss();
    }
  }

  // Navigation helpers       

  goBack() {
    if (this.view === 'detail' || this.view === 'raise') {
      this.view = 'list';
      this.selectedDispute = null;
    } else {
      this.router.navigate(['/transport/transport-dashboard']);
    }
  }

  // Display helpers

  getLabelForCode(code: string): string {
    return this.issueTypes.find(t => t.code === code)?.label ?? code;
  }

  getIconForCode(code: string): string {
    return this.issueTypes.find(t => t.code === code)?.icon ?? 'help-circle-outline';
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      new: 'primary', triaged: 'secondary',
      awaiting_evidence: 'warning', under_review: 'tertiary',
      pending_external_action: 'warning', pending_execution: 'warning',
      resolved: 'success', closed: 'medium', cancelled: 'danger',
    };
    return map[status] ?? 'medium';
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      low: 'success', medium: 'warning', high: 'danger', critical: 'dark'
    };
    return map[priority] ?? 'medium';
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      low: 'TRANSPORT_DISPUTE.PRIORITY_LOW',
      medium: 'TRANSPORT_DISPUTE.PRIORITY_MEDIUM',
      high: 'TRANSPORT_DISPUTE.PRIORITY_HIGH',
      critical: 'TRANSPORT_DISPUTE.PRIORITY_CRITICAL'
    };
    return this.translate.instant(map[priority] ?? 'TRANSPORT_DISPUTE.PRIORITY_MEDIUM');
  }

  resetForm() {
    this.form = { issue_type_code: '', title: '', description: '',
      job_id: null, order_id: null, priority: 'medium', incident_at: '' };
    this.formErrors = {};
    this.pendingFiles = [];
    this.pendingPreviews = [];
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}