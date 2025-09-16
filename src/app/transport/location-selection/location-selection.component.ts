import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationPreferenceService, City, Mandi, LocationPreference } from '../location-selection/location-selection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-location-selection-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './location-selection.component.html',
  styleUrls: ['./location-selection.component.scss']
})
export class LocationSelectionModalComponent implements OnInit, OnDestroy {
  cities: City[] = [];
  mandis: Mandi[] = [];
  selectedCities: number[] = [];
  selectedMandis: number[] = [];
  isLoading = false;
  private subscription = new Subscription();

  constructor(
    private modalController: ModalController,
    private locationService: LocationPreferenceService,
    private toastController: ToastController
  ) {}

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
    this.selectedMandis = [...preferences.mandis];
  }

  private loadCities() {
    this.isLoading = true;
    const sub = this.locationService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
        if (this.selectedCities.length > 0) {
          this.loadMandis();
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

  private loadMandis() {
    if (this.selectedCities.length === 0) {
      this.mandis = [];
      this.selectedMandis = [];
      this.isLoading = false;
      return;
    }

    const sub = this.locationService.getMandisByCities(this.selectedCities).subscribe({
      next: (mandis) => {
        this.mandis = mandis;
        // Filter out mandis that are no longer available
        this.selectedMandis = this.selectedMandis.filter(mandiId =>
          mandis.some(mandi => mandi.id === mandiId)
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load mandis:', error);
        this.showToast('Failed to load mandis', 'danger');
        this.isLoading = false;
      }
    });
    this.subscription.add(sub);
  }

  onCitySelectionChange() {
    // Filter out deselected cities and their mandis
    const removedCities = this.selectedCities.filter(cityId =>
      !this.cities.some(city => city.id === cityId)
    );

    if (removedCities.length > 0) {
      this.selectedMandis = this.selectedMandis.filter(mandiId =>
        !this.mandis.some(mandi =>
          removedCities.includes(mandi.city_id) && mandi.id === mandiId
        )
      );
    }

    this.loadMandis();
  }

  isCitySelected(cityId: number): boolean {
    return this.selectedCities.includes(cityId);
  }

  isMandiSelected(mandiId: number): boolean {
    return this.selectedMandis.includes(mandiId);
  }

  toggleCity(cityId: number) {
    const index = this.selectedCities.indexOf(cityId);
    if (index > -1) {
      this.selectedCities.splice(index, 1);
      // Remove mandis from deselected city
      this.selectedMandis = this.selectedMandis.filter(mandiId =>
        !this.mandis.some(mandi => mandi.city_id === cityId && mandi.id === mandiId)
      );
    } else {
      this.selectedCities.push(cityId);
    }
    this.onCitySelectionChange();
  }

  toggleMandi(mandiId: number) {
    const index = this.selectedMandis.indexOf(mandiId);
    if (index > -1) {
      this.selectedMandis.splice(index, 1);
    } else {
      this.selectedMandis.push(mandiId);
    }
  }

  selectAllCities() {
    this.selectedCities = this.cities.map(city => city.id);
    this.onCitySelectionChange();
  }

  clearAllCities() {
    this.selectedCities = [];
    this.selectedMandis = [];
    this.onCitySelectionChange();
  }

  selectAllMandis() {
    this.selectedMandis = this.mandis.map(mandi => mandi.id);
  }

  clearAllMandis() {
    this.selectedMandis = [];
  }

  getSelectedCityNames(): string {
    return this.cities
      .filter(city => this.selectedCities.includes(city.id))
      .map(city => city.name)
      .join(', ');
  }

  getSelectedMandiNames(): string {
    return this.mandis
      .filter(mandi => this.selectedMandis.includes(mandi.id))
      .map(mandi => mandi.name)
      .join(', ');
  }

  async savePreferences() {
    if (this.selectedCities.length === 0 && this.selectedMandis.length === 0) {
      await this.showToast('Please select at least one city or mandi', 'warning');
      return;
    }

    const preferences: LocationPreference = {
      cities: this.selectedCities,
      mandis: this.selectedMandis
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