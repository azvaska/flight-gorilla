
import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmCardDescriptionDirective,
  HlmCardContentDirective,
  HlmCardFooterDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@/app/auth/auth.service';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { SearchInputComponent, SearchInputValue } from '@/app/components/ui/search-input/search-input.component';
import { INation } from '@/types/search/location';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
    HlmCardContentDirective,
    HlmCardFooterDirective,
    HlmLabelDirective,
    HlmInputDirective,
    HlmButtonDirective,
    CommonModule,
    SearchInputComponent,
  ],
})
export class RegisterComponent implements OnInit {
  protected registerForm: FormGroup = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z]+$/),
      Validators.minLength(2),
      Validators.maxLength(50),
    ]),
    surname: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z]+$/),
      Validators.minLength(2),
      Validators.maxLength(50),
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/),
    ]),
    address: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100),
    ]),
    zipCode: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{5}$/),
    ]),
    nation_id: new FormControl('', Validators.required),
  });

  protected nations: SearchInputValue<INation>[] = [];
  protected selectedNation: SearchInputValue<INation> | undefined = undefined;
  protected searchValue: string = '';
  protected isLoading = false;
  protected errorMessage: string = '';

  private redirectUrl: string = '/';
  private originalState: any = {};

  constructor(
    private authService: AuthService,
    private searchFetchService: SearchFetchService,
    private router: Router
  ) {
    this.redirectUrl = this.router.getCurrentNavigation()?.extras.state?.['redirectUrl'] || '/';
    this.originalState = this.router.getCurrentNavigation()?.extras.state?.['originalState'] || {};
  }

  async ngOnInit() {
    await this.fetchNations();
  }

  private async fetchNations(): Promise<void> {
    try {
      const nationsData = await firstValueFrom(this.searchFetchService.getNations());
      this.nations = nationsData.map(nation => ({
        value: nation.name,
        data: nation
      }));
    } catch (error) {
      console.error('Error loading nations:', error);
    }
  }

  protected onNationChange(nation: SearchInputValue<INation> | undefined): void {
    this.selectedNation = nation;
    const nationControl = this.registerForm.get('nation_id');
    
    if (nation?.data) {
      nationControl?.setValue(nation.data.id);
      nationControl?.setErrors(null);
    } else {
      nationControl?.setValue('');
      if (this.searchValue.trim().length > 0) {
        nationControl?.setErrors({ invalidNation: true });
      }
    }
    
    nationControl?.markAsTouched();
    nationControl?.markAsDirty();
  }

  protected onSearchValueChange(value: string): void {
    this.searchValue = value;
    const nationControl = this.registerForm.get('nation_id');
    
    // Se l'utente sta digitando ma non ha selezionato una nazione valida
    if (value.trim().length > 0 && !this.selectedNation?.data) {
      nationControl?.setErrors({ invalidNation: true });
      nationControl?.markAsTouched();
      nationControl?.markAsDirty();
    } else if (value.trim().length === 0) {
      // Se l'utente cancella il testo, resetta la selezione
      this.selectedNation = undefined;
      nationControl?.setValue('');
      // Rimuovi l'errore di nazione invalida ma mantieni required se necessario
      if (nationControl?.hasError('invalidNation')) {
        nationControl?.setErrors(null);
        // Riapplica la validazione required
        nationControl?.updateValueAndValidity();
      }
    }
  }

  async onSubmit() {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const formValue = this.registerForm.value;
        
        // Prepara i dati per la registrazione secondo l'interfaccia del servizio
        const registrationData = {
          email: formValue.email,
          password: formValue.password,
          name: formValue.name,
          surname: formValue.surname,
          address: formValue.address,
          zip: formValue.zipCode,
          nation_id: parseInt(formValue.nation_id, 10)
        };

        await firstValueFrom(this.authService.register(registrationData));
        
        // Registrazione completata con successo, reindirizza usando redirectUrl e originalState
        this.router.navigateByUrl(this.redirectUrl, { state: this.originalState });
        
      } catch (error) {
        console.error('Registration error:', error);
        
        if (error instanceof HttpErrorResponse) {
          // Handle specific server errors
          if (error.status === 400) {
            this.errorMessage = 'Invalid data. Please check your input fields.';
          } else if (error.status === 409) {
            this.errorMessage = 'Email already registered. Please try with another email.';
          } else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = 'Registration error. Please try again.';
          }
        } else {
          this.errorMessage = 'Connection error. Please check your internet connection.';
        }
      } finally {
        this.isLoading = false;
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  protected getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'This field is required';
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'name' || fieldName === 'surname') {
          return 'Only letters are allowed';
        }
        if (fieldName === 'password') {
          return 'Password must be at least 8 characters with at least one uppercase letter and one number';
        }
        if (fieldName === 'zipCode') {
          return 'ZIP code must be exactly 5 digits';
        }
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        if (fieldName === 'name' || fieldName === 'surname') {
          return `Minimum ${requiredLength} characters`;
        }
        if (fieldName === 'address') {
          return `Address must be at least ${requiredLength} characters`;
        }
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        if (fieldName === 'name' || fieldName === 'surname') {
          return `Maximum ${maxLength} characters`;
        }
        if (fieldName === 'address') {
          return `Address must be at most ${maxLength} characters`;
        }
      }
      if (field.errors['invalidNation']) {
        return 'Please select a valid nation';
      }
    }
    return '';
  }

  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login'], {
      state: {
        redirectUrl: this.redirectUrl,
        originalState: this.originalState
      }
    });
  }
}
