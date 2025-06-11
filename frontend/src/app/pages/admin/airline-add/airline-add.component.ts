import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

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

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
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
      console.log('Registering airline:', formData);
      
      // Mock API call - replace with actual service call
      setTimeout(() => {
        this.isLoading = false;
        // Navigate back to airlines list after successful registration
        this.router.navigate(['/airlines']);
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.airlineForm.controls).forEach(key => {
        this.airlineForm.get(key)?.markAsTouched();
      });
    }
  }
} 
