import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationPreferenceService, City, BusinessBranch, LocationPreference } from './location-selection.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  close,
  locationOutline,
  searchOutline,
  businessOutline,
  mailOutline,
  callOutline,
  informationCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-location-selection-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './location-selection.component.html',
  styleUrls: ['./location-selection.component.scss']
})
export class LocationSelectionModalComponent implements OnInit, OnDestroy {
  cities: City[] = [];
  branches: BusinessBranch[] = [];
  filteredCities: City[] = [];
  filteredBranches: BusinessBranch[] = [];
  selectedCities: number[] = [];
  selectedBranches: number[] = [];
  isLoading = false;

  // Search properties
  citySearchTerm: string = '';
  branchSearchTerm: string = '';

  private subscription = new Subscription();

  constructor(
    private modalController: ModalController,
    private locationService: LocationPreferenceService,
    private toastController: ToastController
  ) {
    addIcons({
      close,
      locationOutline,
      searchOutline,
      businessOutline,
      mailOutline,
      callOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    this.loadCurrentPreferences();
    this.loadCities();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadCurrentPreferences() {
    const preferences = this.locationService.getCurrentPreferences();
    this.selectedCities = [...preferences.cities];
    this.selectedBranches = [...preferences.branches];
  }

  private loadCities() {
    this.isLoading = true;
    const sub = this.locationService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
        this.filteredCities = [...cities];
        if (this.selectedCities.length > 0) {
          this.loadBranches();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Failed to load cities:', error);
        this.showToast('Failed to load cities', 'danger');
        this.isLoading = false;
      }
    });
    this.subscription.add(sub);
  }

  private loadBranches() {
    if (this.selectedCities.length === 0) {
      this.branches = [];
      this.filteredBranches = [];
      this.selectedBranches = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    const sub = this.locationService.getBusinessBranchesByCities(this.selectedCities).subscribe({
      next: (cityBranches) => {
        // Flatten all branches from all cities
        this.branches = cityBranches.reduce((allBranches, cityData) => {
          return allBranches.concat(cityData.branches);
        }, [] as BusinessBranch[]);

        this.filteredBranches = [...this.branches];

        // Filter out branches that are no longer available
        this.selectedBranches = this.selectedBranches.filter(branchId =>
          this.branches.some(branch => branch.branch_id === branchId)
        );

        // Apply current search filter
        this.filterBranches();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load branches:', error);
        this.showToast('Failed to load business branches', 'danger');
        this.isLoading = false;
      }
    });
    this.subscription.add(sub);
  }

  // Search functionality
  onCitySearch() {
    this.filterCities();
  }

  onBranchSearch() {
    this.filterBranches();
  }

  private filterCities() {
    if (!this.citySearchTerm.trim()) {
      this.filteredCities = [...this.cities];
      return;
    }

    const searchTerm = this.citySearchTerm.toLowerCase().trim();
    this.filteredCities = this.cities.filter(city =>
      city.city_name.toLowerCase().includes(searchTerm) ||
      city.state_name.toLowerCase().includes(searchTerm) ||
      (city.city_shortnames && city.city_shortnames.toLowerCase().includes(searchTerm))
    );
  }

  private filterBranches() {
    if (!this.branchSearchTerm.trim()) {
      this.filteredBranches = [...this.branches];
      return;
    }

    const searchTerm = this.branchSearchTerm.toLowerCase().trim();
    this.filteredBranches = this.branches.filter(branch =>
      branch.shop_name.toLowerCase().includes(searchTerm) ||
      branch.address.toLowerCase().includes(searchTerm) ||
      branch.email.toLowerCase().includes(searchTerm)
    );
  }

  clearCitySearch() {
    this.citySearchTerm = '';
    this.filterCities();
  }

  clearBranchSearch() {
    this.branchSearchTerm = '';
    this.filterBranches();
  }

  onCitySelectionChange() {
    this.loadBranches();
  }

  isCitySelected(cityId: number): boolean {
    return this.selectedCities.includes(cityId);
  }

  isBranchSelected(branchId: number): boolean {
    return this.selectedBranches.includes(branchId);
  }

  toggleCity(cityId: number) {
    const index = this.selectedCities.indexOf(cityId);
    if (index > -1) {
      this.selectedCities.splice(index, 1);
      // Remove branches from deselected city
      this.loadBranches();
    } else {
      this.selectedCities.push(cityId);
      this.onCitySelectionChange();
    }
  }

  toggleBranch(branchId: number) {
    const index = this.selectedBranches.indexOf(branchId);
    if (index > -1) {
      this.selectedBranches.splice(index, 1);
    } else {
      this.selectedBranches.push(branchId);
    }
  }

  selectAllCities() {
    // Select all filtered cities or all cities if no search
    const citiesToSelect = this.filteredCities.length > 0 ? this.filteredCities : this.cities;
    this.selectedCities = [...new Set([...this.selectedCities, ...citiesToSelect.map(city => city.id)])];
    this.onCitySelectionChange();
  }

  clearAllCities() {
    this.selectedCities = [];
    this.selectedBranches = [];
    this.onCitySelectionChange();
  }

  selectAllBranches() {
    // Select all filtered branches or all branches if no search
    const branchesToSelect = this.filteredBranches.length > 0 ? this.filteredBranches : this.branches;
    this.selectedBranches = [...new Set([...this.selectedBranches, ...branchesToSelect.map(branch => branch.branch_id)])];
  }

  clearAllBranches() {
    this.selectedBranches = [];
  }

  getSelectedCityNames(): string {
    return this.cities
      .filter(city => this.selectedCities.includes(city.id))
      .map(city => city.city_name)
      .join(', ');
  }

  getSelectedBranchNames(): string {
    return this.branches
      .filter(branch => this.selectedBranches.includes(branch.branch_id))
      .map(branch => branch.shop_name)
      .join(', ');
  }

  async savePreferences() {
    if (this.selectedCities.length === 0 && this.selectedBranches.length === 0) {
      await this.showToast('Please select at least one city or business branch', 'warning');
      return;
    }

    const preferences: LocationPreference = {
      cities: this.selectedCities,
      branches: this.selectedBranches
    };

    this.locationService.savePreferences(preferences);
    await this.showToast('Preferences saved successfully', 'success');
    await this.modalController.dismiss(preferences);
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}