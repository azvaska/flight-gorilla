import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HlmButtonDirective} from "@spartan-ng/ui-button-helm";
import {UserInfo} from '@/types/user-info';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import {FormsModule} from '@angular/forms';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';

import {SwitcherComponent} from '@/app/components/ui/switcher/switcher.component';
import {NgClass, NgIf} from '@angular/common';
import {HlmIconDirective} from "@spartan-ng/ui-icon-helm";
import {NgIcon, provideIcons} from "@ng-icons/core";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    HlmButtonDirective,
    FormsModule,
    HlmInputDirective,
    SwitcherComponent,
    NgClass,
    NgIf,
    HlmIconDirective,
    NgIcon,
    BrnSelectImports,
    HlmSelectImports
  ],
  templateUrl: './profile.component.html',
  providers: [provideIcons({ lucideLoaderCircle })]
})
export class ProfileComponent implements OnInit {
  private readonly defaultUser: UserInfo = {
    email: '',
    password: '',
    name: '',
    surname: '',
    address: '',
    zipCode: ''
  }
  @Input({required: true}) user: UserInfo;

  protected newUser: UserInfo;

  constructor() {
    this.user = {...this.defaultUser};
    this.newUser = {...this.defaultUser};
  }

  ngOnInit() {
    this.newUser = {...this.user};
  }


  @Output() userChange = new EventEmitter<UserInfo>();

  @Input() isEditMode = false;
  @Output() isEditModeChange = new EventEmitter<boolean>();
  @Output() saveEdit = new EventEmitter<UserInfo>();

  protected oldPassword = '';

  editClickedHandler() {
    if(this.isEditMode) {
      this.newUser = {...this.user};
      this.resetFlags();
    }
    this.isEditMode = !this.isEditMode;
    this.isEditModeChange.emit();
  }


  protected loadingSave = false;    // when true the save button is disabled and shows a spinner

  saveClickedHandler() {
    // check which fields are dirty and create a new object with only those fields
    const updatedUser: UserInfo = {
      email: this.emailDirty ? this.newUser.email : this.user.email,
      password: this.passwordDirty ? this.newUser.password : this.user.password,
      name: this.nameDirty ? this.newUser.name : this.user.name,
      surname: this.surnameDirty ? this.newUser.surname : this.user.surname,
      address: this.addressDirty ? this.newUser.address : this.user.address,
      zipCode: this.zipCodeDirty ? this.newUser.zipCode : this.user.zipCode
    };
    // sarebbe da modificare UserInfo per poter avere meno valori e non dover passare tutti i campi

    this.loadingSave = true;

    // timeout for fake loading
    setTimeout(() => {
      this.loadingSave = false;
      this.isEditMode = false;
      this.isEditModeChange.emit();
      this.userChange.emit(updatedUser);

      // if the API response is successful, update the user and reset the flags
      this.saveEdit.emit(updatedUser);
      this.resetFlags();
    }, 1000); // 1 second fake loading
  }

  private resetFlags() {
    this.emailDirty = false;
    this.emailTouched = false;
    this.passwordDirty = false;
    this.passwordTouched = false;
    this.nameDirty = false;
    this.nameTouched = false;
    this.surnameDirty = false;
    this.surnameTouched = false;
    this.addressDirty = false;
    this.addressTouched = false;
    this.zipCodeDirty = false;
    this.zipCodeTouched = false;
  }







  // CHECKS

  // ——— Validation state flags ———
  emailDirty = false;
  emailTouched = false;
  passwordDirty = false;
  passwordTouched = false;
  nameDirty = false;
  nameTouched = false;
  surnameDirty = false;
  surnameTouched = false;
  addressDirty = false;
  addressTouched = false;
  zipCodeDirty = false;
  zipCodeTouched = false;

  // ——— Regex patterns ———
  private emailPattern     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private passwordPattern  = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  private namePattern      = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  private zipCodePattern   = /^\d{5}(?:[-\s]\d{4})?$/;

  // ——— Getters for validity ———
  get isEmailValid(): boolean {
    return this.emailPattern.test(this.newUser.email);
  }
  get isPasswordValid(): boolean {
    return this.passwordPattern.test(this.newUser.password || '');
  }
  get isNameValid(): boolean {
    return this.namePattern.test(this.newUser.name);
  }
  get isSurnameValid(): boolean {
    return this.namePattern.test(this.newUser.surname);
  }
  get isAddressValid(): boolean {
    return !!this.newUser.address?.trim();
  }
  get isZipCodeValid(): boolean {
    return this.zipCodePattern.test(this.newUser.zipCode);
  }

  get isFormValid(): boolean {
    // the form is valid if at least one field is dirty and all dirty fields are valid
    return (this.emailDirty && this.isEmailValid)
      || (this.passwordDirty && this.isPasswordValid)
      || (this.nameDirty && this.isNameValid)
      || (this.surnameDirty && this.isSurnameValid)
      || (this.addressDirty && this.isAddressValid)
      || (this.zipCodeDirty && this.isZipCodeValid);
  }
}
