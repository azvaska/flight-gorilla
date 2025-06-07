import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { SwitcherComponent } from '@/app/components/ui/switcher/switcher.component';
import { NgIf } from '@angular/common';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { CommonModule, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { LoadingService } from '@/app/services/loading.service';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { IAirline } from '@/types/airline/airline';

@Component({
  selector: 'app-airline-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HlmInputDirective,
    SwitcherComponent,
    HlmButtonDirective,
    HlmIconDirective,
    NgIcon,
    NgIf,
    CommonModule
  ],
  templateUrl: './airline-profile.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
  host: {
    class: 'block w-full h-fit',
  },
})

export class AirlineProfileComponent {
  protected airline!: IAirline;
  protected profileForm!: FormGroup;
  protected isEditMode = false;
  protected isLoading = false;

  constructor(
    private airlineFetchService: AirlineFetchService,
    private loadingService: LoadingService
  ) {
    this.fetchAirline().then((data) => {
      this.airline = data;
      this.initForm();
    });
  }

  private initForm(): void {
    this.profileForm = new FormGroup({
      name: new FormControl(this.airline.name, [Validators.required]),
      nation_id: new FormControl(this.airline.nation_id, [Validators.required]),
      address: new FormControl(this.airline.address, [Validators.required]),
      zip: new FormControl(this.airline.zip, [Validators.required, Validators.pattern(/^\d{5}$/)]),
      email: new FormControl(this.airline.email, [Validators.required, Validators.email]),
      website: new FormControl(this.airline.website, [Validators.required]),
      first_class_description: new FormControl(this.airline.first_class_description),
      business_class_description: new FormControl(this.airline.business_class_description),
      economy_class_description: new FormControl(this.airline.economy_class_description)
    });
  }

  private async fetchAirline(): Promise<IAirline> {
    this.loadingService.startLoadingTask();
    const data = await firstValueFrom(this.airlineFetchService.getAirline());
    this.loadingService.endLoadingTask();
    return data;
  }

  protected toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.profileForm.reset({ ...this.airline });
    }
  }

  protected async onFormSubmit(): Promise<void> {
    if (this.profileForm.pristine) {
      this.toggleEditMode();
      return;
    }

    const updated: Partial<IAirline> = this.profileForm.value;
    this.isLoading = true;

    const changes: Partial<IAirline> = Object.fromEntries(
      Object.entries(updated).filter(
        ([key, value]) => (this.airline as any)[key] !== value
      )
    ) as Partial<IAirline>;

    const result = await firstValueFrom(
      this.airlineFetchService.updateAirline(this.airline.id, changes)
    );
    this.airline = result;
    this.isLoading = false;
    this.toggleEditMode();
  }
}
