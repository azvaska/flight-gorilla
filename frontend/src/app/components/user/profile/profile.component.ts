import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';

import { SwitcherComponent } from '@/app/components/ui/switcher/switcher.component';
import { NgClass, NgIf } from '@angular/common';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { IUser } from '@/types/user/user';
import { firstValueFrom } from 'rxjs';
import { UserFetchService } from '@/app/services/user/user-fetch.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { INation } from '@/types/search/location';
import { SearchInputComponent, SearchInputValue } from '@/app/components/ui/search-input/search-input.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    HlmButtonDirective,
    FormsModule,
    ReactiveFormsModule,
    HlmInputDirective,
    SwitcherComponent,
    NgIf,
    HlmIconDirective,
    NgIcon,
    BrnSelectImports,
    HlmSelectImports,
    SearchInputComponent,
  ],
  templateUrl: './profile.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
})
export class ProfileComponent {
  @Input() user!: IUser;
  @Input() isEditMode = false;
  @Output() isEditModeChange = new EventEmitter<boolean>();
  @Output() userChange = new EventEmitter<IUser>();

  protected isLoading = false;
  protected profileForm!: FormGroup;
  protected nations: SearchInputValue<INation>[] = [];
  protected selectedNation: SearchInputValue<INation> | undefined = undefined;
  protected searchValue: string = '';

  constructor(
    private userFetchService: UserFetchService,
    private searchFetchService: SearchFetchService
  ) {
    this.fetchNations().then(() => {
      this.initForm();
    });
  }

  private async fetchNations(): Promise<void> {
    try {
      const nationsData = await firstValueFrom(this.searchFetchService.getNations());
      this.nations = nationsData.map(nation => ({
        value: nation.name,
        data: nation
      }));
      
      // Trova la nazione selezionata basata sull'ID dell'utente
      if (this.user.nation) {
        this.selectedNation = this.nations.find(n => n.data?.id === this.user.nation.id);
        this.searchValue = this.selectedNation?.value || '';
      }
    } catch (error) {
      console.error('Error fetching nations:', error);
    }
  }

  private initForm(): void {
    this.profileForm = new FormGroup({
      email: new FormControl(this.user.email, [
        Validators.required,
        Validators.email,
      ]),
      oldPassword: new FormControl(''),
      password: new FormControl('', {
        validators: [Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)],
        updateOn: 'blur',
      }),
      name: new FormControl(this.user.name, [
        Validators.required,
        Validators.pattern(/^[a-zA-Z]+$/),
        Validators.minLength(2),
        Validators.maxLength(50),
      ]),
      surname: new FormControl(this.user.surname, [
        Validators.required,
        Validators.pattern(/^[a-zA-Z]+$/),
        Validators.minLength(2),
        Validators.maxLength(50),
      ]),
      address: new FormControl(this.user.address, [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(100),
      ]),
      zip: new FormControl(this.user.zip, [
        Validators.required,
        Validators.pattern(/^\d{5}$/),
      ]),
      nation_id: new FormControl(this.user.nation.id, [Validators.required]),
    });

    this.profileForm
      .get('password')
      ?.valueChanges.subscribe((passwordValue) => {
        const oldPasswordControl = this.profileForm.get('oldPassword');
        if (passwordValue) {
          oldPasswordControl?.setValidators(Validators.required);
        } else {
          oldPasswordControl?.clearValidators();
        }
        oldPasswordControl?.updateValueAndValidity();
      });
  }

  protected onNationChange(nation: SearchInputValue<INation> | undefined): void {
    this.selectedNation = nation;
    const nationControl = this.profileForm.get('nation_id');
    
    if (nation?.data) {
      nationControl?.setValue(nation.data.id);
      nationControl?.setErrors(null);
    } else {
      nationControl?.setValue(null);
      // Se c'è del testo nella ricerca ma nessuna nazione selezionata, marca come errore
      if (this.searchValue.trim().length > 0) {
        nationControl?.setErrors({ invalidNation: true });
      } else {
        // Se non c'è testo e non c'è selezione, usa la validazione required standard
        nationControl?.setErrors({ required: true });
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

  protected toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    // Reset del form con i valori corretti
    this.profileForm.reset({
      email: this.user.email,
      oldPassword: '',
      password: '',
      name: this.user.name,
      surname: this.user.surname,
      address: this.user.address,
      zip: this.user.zip,
      nation_id: this.user.nation?.id || null
    });
    
    if (!this.isEditMode) {
      // Ripristina la nazione selezionata
      if (this.user.nation) {
        this.selectedNation = this.nations.find(n => n.data?.id === this.user.nation.id);
      } else {
        this.selectedNation = undefined;
      }
      this.searchValue = this.selectedNation?.value || '';
    }
    
    this.isEditModeChange.emit(this.isEditMode);
  }

  protected async onFormSubmit() {
    if (this.profileForm.pristine) {
      this.toggleEditMode();
      return;
    }
    
    const updatedUser: {
      name: string;
      surname: string;
      email: string;
      nation_id: number;
      address: string;
      zip: string;
      password?: string;
      oldPassword?: string;
    } = this.profileForm.value;
    
    
    this.isLoading = true;

    try {
      const newUser = await firstValueFrom(
        this.userFetchService.updateUser(this.user.id, {
          name: updatedUser.name!,
          surname: updatedUser.surname!,
          email: updatedUser.email!,
          nation_id: updatedUser.nation_id!,
          address: updatedUser.address!,
          zip: updatedUser.zip!,
        })
      );

      if (updatedUser.password && updatedUser.oldPassword) {
        console.log("changing password")
        try{

          await firstValueFrom(
            this.userFetchService.updatePassword(
              updatedUser.oldPassword,
              updatedUser.password
            )
          );
        } catch (error) {
          if(error instanceof HttpErrorResponse) {
            if(error.status === 403) {
              this.profileForm.get('oldPassword')?.setErrors({ incorrect: true });
              this.isLoading = false;
              return;
            }
          }
          // For other password-related errors, set a generic error
          this.profileForm.setErrors({ error: 'Unknown error' });
          this.isLoading = false;
          return;
        } 
      }

      this.isLoading = false;
      this.userChange.emit(newUser);
      this.toggleEditMode();
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      this.profileForm.setErrors({ error: 'Unknown error' });
      this.isLoading = false;
    }
  }
}
