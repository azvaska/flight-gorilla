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
  ],
  templateUrl: './profile.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
})
export class ProfileComponent implements OnInit {
  @Input() user!: IUser;
  @Input() isEditMode = false;
  @Output() isEditModeChange = new EventEmitter<boolean>();
  @Output() userChange = new EventEmitter<IUser>();

  protected isLoading = false;

  protected profileForm!: FormGroup;

  constructor(private userFetchService: UserFetchService) {}

  ngOnInit(): void {
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

  protected toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    this.profileForm.reset(this.user);
    this.isEditModeChange.emit(this.isEditMode);
  }

  protected async onFormSubmit() {
    if (this.profileForm.pristine) {
      this.toggleEditMode();
      return;
    }
    
    const updatedUser: Partial<IUser> & {
      password?: string;
      oldPassword?: string;
    } = this.profileForm.value;
    
    console.log("updatedUser", updatedUser);
    
    this.isLoading = true;

    const changedValues = Object.fromEntries(
      Object.entries(this.user).flatMap(([key, value]) => {
        const newValue = updatedUser[key as keyof typeof updatedUser];
        return newValue !== undefined && newValue !== value
          ? [[key, newValue]]
          : [];
      })
    );

    await firstValueFrom(
      this.userFetchService.updateUser(this.user.id, changedValues)
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
      } 
    }

    this.isLoading = false;
    this.toggleEditMode();
  }
}
