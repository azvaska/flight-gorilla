// navbar.component.ts
import { Component, ViewChild } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  HlmAvatarComponent,
  HlmAvatarFallbackDirective,
} from '@spartan-ng/ui-avatar-helm';
import { AuthService } from '@/app/auth/auth.service';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';
import { UserFetchService } from '@/app/services/user/user-fetch.service';
import { IUser } from '@/types/user/user';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmButtonDirective,
    PopoverComponent,
    PopoverTriggerDirective,
    RouterLink,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  protected isLoggedIn = false;
  protected user: IUser | null = null;

  @ViewChild('popover') popover!: PopoverComponent;

  closePopover() {
    this.popover.close();
  }

  constructor(
    private authService: AuthService,
    private userFetchService: UserFetchService
  ) {
    this.authService.loggedIn$.subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;
      if (this.isLoggedIn) {
        // We try and fetch user infos
        firstValueFrom(this.userFetchService.getUser())
          .then((user) => (this.user = user))
          .catch((error) => {
            console.error(error);
            // If the user is not found, we logout
            this.authService.logout();
          });
      } else {
        this.user = null;
      }
    });
  }

  protected logout() {
    firstValueFrom(this.authService.logout());
  }
}
