import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmTableModule } from '@spartan-ng/ui-table-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { HlmAlertDialogModule } from '@spartan-ng/ui-alertdialog-helm';
import { BrnAlertDialogContentDirective, BrnAlertDialogTriggerDirective } from '@spartan-ng/brain/alert-dialog';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';
import { AdminFetchService } from '@/app/services/admin/admin-fetch.service';
import { IUser } from '@/types/user/user';
import { toast } from 'ngx-sonner';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';

@Component({
  selector: 'app-users-list',
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmCardDirective,
    HlmTableModule,
    NgIcon,
    PopoverComponent,
    HlmAlertDialogModule,
    BrnAlertDialogContentDirective,
    BrnAlertDialogTriggerDirective,
    HlmSpinnerComponent,
    PopoverTriggerDirective,
    HlmToasterComponent
  ],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './users-list.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class UsersListComponent implements OnInit {
  protected users: IUser[] = [];
  protected isDeleteUserLoading = false;
  protected isLoadingUsers = false;

  constructor(private adminFetchService: AdminFetchService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoadingUsers = true;
    
    this.adminFetchService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoadingUsers = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento degli utenti:', error);
        this.isLoadingUsers = false;
        // Qui potresti aggiungere una notifica di errore per l'utente
      }
    });
  }

  protected deleteUser(userId: string, ctx: any): void {
    this.isDeleteUserLoading = true;
    
    this.adminFetchService.deleteUser(userId).subscribe({
      next: () => {
        // Rimuovi l'utente dalla lista locale dopo la cancellazione riuscita
        this.users = this.users.filter(user => user.id !== userId);
        this.isDeleteUserLoading = false;
        ctx.close();
      },
      error: (error) => {
        console.error('Errore nella cancellazione dell\'utente:', error);
        this.isDeleteUserLoading = false;
        
        // Check if the error is a 409 Conflict
        if (error?.status === 409) {
          toast('Cannot delete this element', {
            description:
              'This user cannot be deleted because it is currently in use.',
          });
        } else {
          toast('Unknown error', {
            description: 'An unexpected error occurred while deleting the user.',
          });
        }
        
        ctx.close();
      }
    });
  }
} 
