import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';
import { ConsoleAdminService } from './console-admin.service';
import { ConsoleModuleAccessItem, ConsoleModuleUser } from './console-admin.models';

type ModuleCode = 'admin' | 'ops_l1' | 'finance';

@Component({
  selector: 'app-console-access-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
  ],
  templateUrl: './console-access-page.component.html',
  styleUrls: ['./console-access-page.component.scss'],
})
export class ConsoleAccessPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  protected readonly moduleOptions: Array<{ value: ModuleCode; label: string }> = [
    { value: 'admin', label: 'Admin' },
    { value: 'ops_l1', label: 'Ops' },
    { value: 'finance', label: 'Finance' },
  ];

  protected isLoading = true;
  protected isSaving = false;
  protected errorMessage: string | null = null;
  protected eligibleUsers: ConsoleModuleUser[] = [];
  protected activeAccess: ConsoleModuleAccessItem[] = [];

  protected readonly grantForm = this.fb.nonNullable.group({
    user_id: [0, [Validators.required, Validators.min(1)]],
    module_code: ['ops_l1' as ModuleCode, Validators.required],
    reason: ['Granted from console access page', [Validators.required, Validators.maxLength(200)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ConsoleAdminService,
    private readonly toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected get filteredUsers(): ConsoleModuleUser[] {
    return this.eligibleUsers.filter((user) => ['admin', 'ops_l1', 'finance'].includes(user.base_role_code));
  }

  protected get groupedAccess(): Array<{ moduleCode: ModuleCode; label: string; items: ConsoleModuleAccessItem[] }> {
    return this.moduleOptions.map((option) => ({
      moduleCode: option.value,
      label: option.label,
      items: this.activeAccess.filter((item) => item.module_code === option.value),
    }));
  }

  protected async grantAccess(): Promise<void> {
    if (this.grantForm.invalid || this.isSaving) {
      this.grantForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.service.grantModuleAccess(this.grantForm.getRawValue())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: async () => {
          await this.presentToast('Access granted successfully.');
          this.loadData();
        },
        error: async (error) => {
          await this.presentToast(error?.error?.error || 'We could not grant access right now.');
        },
      });
  }

  protected async revokeAccess(item: ConsoleModuleAccessItem): Promise<void> {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.service.revokeModuleAccess({
      user_id: item.user_id,
      module_code: item.module_code,
      reason: 'Revoked from console access page',
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: async () => {
          await this.presentToast('Access revoked successfully.');
          this.loadData();
        },
        error: async (error) => {
          await this.presentToast(error?.error?.error || 'We could not revoke access right now.');
        },
      });
  }

  protected getUserLabel(user: ConsoleModuleUser): string {
    return `${user.name} (${this.roleLabel(user.base_role_code)})`;
  }

  protected roleLabel(roleCode: string): string {
    switch (roleCode) {
      case 'ops_l1':
        return 'Ops';
      case 'finance':
        return 'Finance';
      case 'admin':
        return 'Admin';
      default:
        return roleCode;
    }
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      users: this.service.getModuleUsers(),
      access: this.service.getActiveModuleAccess(),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: ({ users, access }) => {
          this.eligibleUsers = users.items;
          this.activeAccess = access.items;
          if (!this.grantForm.value.user_id && this.filteredUsers.length > 0) {
            this.grantForm.patchValue({ user_id: this.filteredUsers[0].user_id });
          }
        },
        error: () => {
          this.errorMessage = 'We could not load console access right now.';
        },
      });
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2400,
      position: 'top',
      color: 'dark',
    });
    await toast.present();
  }
}
