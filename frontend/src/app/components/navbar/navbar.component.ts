// navbar.component.ts
import { Component } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  HlmAvatarComponent,
  HlmAvatarImageDirective,
  HlmAvatarFallbackDirective
} from '@spartan-ng/ui-avatar-helm';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    HlmAvatarComponent,
    HlmAvatarImageDirective,
    HlmAvatarFallbackDirective,
    HlmButtonDirective
  ],
  templateUrl: './navbar.component.html',
  
})
export class NavbarComponent {
  isLoggedIn = false;
}
