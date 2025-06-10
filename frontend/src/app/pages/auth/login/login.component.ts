// login.component.ts
import { Component } from '@angular/core';
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
import { AuthService } from '@/app/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
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
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', Validators.required),
  });

  private redirectUrl: string = '/';
  private originalState: any = {};

  constructor(private authService: AuthService, private router: Router) {
    this.redirectUrl = this.router.getCurrentNavigation()?.extras.state?.['redirectUrl'] || '/';
    this.originalState = this.router.getCurrentNavigation()?.extras.state?.['originalState'] || {};
  }


  onSubmit() {
    if (this.loginForm.valid) {
      this.authService
        .login({
          email: this.loginForm.value.email!,
          password: this.loginForm.value.password!,
        })
        .subscribe({
          next: () => {
            this.router.navigateByUrl(this.redirectUrl, { state: this.originalState });
          },
          error: (err) => {
            if (err.status === 401) {
              this.loginForm.setErrors({ error: 'Invalid email or password' });
            } else {
              this.loginForm.setErrors({ error: 'Unknown error' });
            }
          },
        });
    }
  }

  protected navigateToRegister(): void {
    this.router.navigate(['/auth/register'], {
      state: {
        redirectUrl: this.redirectUrl,
        originalState: this.originalState
      }
    });
  }
}
