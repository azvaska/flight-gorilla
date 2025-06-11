import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';
import { AdminFetchService } from '@/app/services/admin/admin-fetch.service';

@Component({
  selector: 'app-airline-add',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmSpinnerComponent
  ],
  templateUrl: './airline-add.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class AirlineAddComponent implements OnInit {
  protected airlineForm!: FormGroup;
  protected isLoading = false;
  protected registrationComplete = false;
  protected generatedPassword = '';
  protected adminEmail = '';
  protected passwordCopied = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private adminFetchService: AdminFetchService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.airlineForm = this.formBuilder.group({
      adminName: ['', [Validators.required, Validators.minLength(2)]],
      adminSurname: ['', [Validators.required, Validators.minLength(2)]],
      airlineName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  protected onSubmit(): void {
    if (this.airlineForm.valid) {
      this.isLoading = true;
      
      const formData = this.airlineForm.value;
      
      const registrationData = {
        email: formData.email,
        name: formData.adminName,
        surname: formData.adminSurname,
        airline_name: formData.airlineName
      };

      this.adminFetchService.registerAirline(registrationData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.registrationComplete = true;
          this.generatedPassword = response.credentials.password;
          this.adminEmail = response.credentials.email;
        },
        error: (error) => {
          console.error('Errore nella registrazione della compagnia aerea:', error);
          this.isLoading = false;
          // Qui potresti aggiungere una notifica di errore per l'utente
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.airlineForm.controls).forEach(key => {
        this.airlineForm.get(key)?.markAsTouched();
      });
    }
  }

  protected copyPassword(): void {
    navigator.clipboard.writeText(this.generatedPassword).then(() => {
      this.passwordCopied = true;
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        this.passwordCopied = false;
      }, 2000);
    }).catch(err => {
      console.error('Errore nella copia della password:', err);
    });
  }

  protected goBack(): void {
    this.router.navigate(['/airlines']);
  }
} 
