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
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { IAirline } from '@/types/airline/airline';
import { INation } from '@/types/search/location';
import { SearchInputComponent, SearchInputValue } from '@/app/components/ui/search-input/search-input.component';

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
    CommonModule,
    SearchInputComponent
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
  protected nations: SearchInputValue<INation>[] = [];
  protected selectedNation: SearchInputValue<INation> | undefined = undefined;
  protected searchValue: string = '';

  constructor(
    private airlineFetchService: AirlineFetchService,
    private searchFetchService: SearchFetchService,
    private loadingService: LoadingService
  ) {
    Promise.all([
      this.fetchAirline(),
      this.fetchNations()
    ]).then(([airlineData, nationsData]) => {
      this.airline = airlineData;
      this.nations = nationsData.map(nation => ({
        value: nation.name,
        data: nation
      }));
      
      // Trova la nazione selezionata basata sull'ID della compagnia aerea
      this.selectedNation = this.nations.find(n => n.data?.id === this.airline.nation_id);
      
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

  private async fetchNations(): Promise<INation[]> {
    this.loadingService.startLoadingTask();
    const data = await firstValueFrom(this.searchFetchService.getNations());
    this.loadingService.endLoadingTask();
    return data;
  }

  protected onNationChange(nation: SearchInputValue<INation> | undefined): void {
    this.selectedNation = nation;
    const nationControl = this.profileForm.get('nation_id');
    
    if (nation?.data) {
      nationControl?.setValue(nation.data.id);
      nationControl?.setErrors(null);
    } else {
      nationControl?.setValue('');
      // Se c'è del testo nella ricerca ma nessuna nazione selezionata, marca come errore
      if (this.searchValue.trim().length > 0) {
        nationControl?.setErrors({ invalidNation: true });
      }
    }
    
    // Marca il controllo come "touched" e "dirty" per attivare la validazione
    nationControl?.markAsTouched();
    nationControl?.markAsDirty();
  }

  protected onSearchValueChange(searchValue: string): void {
    this.searchValue = searchValue;
    const nationControl = this.profileForm.get('nation_id');
    
    // Se l'utente sta digitando ma non ha selezionato una nazione valida
    if (searchValue.trim().length > 0 && !this.selectedNation?.data) {
      nationControl?.setErrors({ invalidNation: true });
      nationControl?.markAsTouched();
      nationControl?.markAsDirty();
    } else if (searchValue.trim().length === 0 && !this.selectedNation?.data) {
      // Se il campo è vuoto e non c'è selezione, usa la validazione required standard
      nationControl?.setErrors({ required: true });
      nationControl?.markAsTouched();
      nationControl?.markAsDirty();
    }
  }

  protected toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.profileForm.reset({ ...this.airline });
      // Ripristina la nazione selezionata
      this.selectedNation = this.nations.find(n => n.data?.id === this.airline.nation_id);
      this.searchValue = this.selectedNation?.value || '';
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
