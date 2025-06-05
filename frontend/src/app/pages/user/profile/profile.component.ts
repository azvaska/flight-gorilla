// src/app/my-profile/my-profile.component.ts
import { Component } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {PayementCardListComponent} from '@/app/components/user/payement-card-list/payement-card-list.component';
import {IPayementCard} from '@/types/user/payement-card';
import {ProfileComponent} from '@/app/components/user/profile/profile.component';
import {NgClass} from '@angular/common';
import {IUser} from '@/types/user/user';
import { LoadingService } from '@/app/services/loading.service';
import { UserFetchService } from '@/app/services/user/user-fetch.service';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'user-profile',
  standalone: true,
  imports: [
    PayementCardListComponent,
    ProfileComponent,
    NgClass,
    CommonModule
  ],
  host: {
    class: 'block w-full h-full',
  },
  templateUrl: './profile.component.html'
})
export class UserProfileComponent {
  protected user: IUser | undefined = undefined;
  
  protected selectedCardId: number | 'new' = 1;
  protected isEditingProfile = false;

  constructor(private userFetchService: UserFetchService, private loadingService: LoadingService) {
    this.fetchUser().then((user) => {
      this.user = user
    })
  }

  private async fetchUser() {
    this.loadingService.startLoadingTask()
    const user = await firstValueFrom(this.userFetchService.getUser())
    this.loadingService.endLoadingTask()
    return user
  }



  protected toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
  }

}
