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

// Mock user interface - replace with actual interface
interface IUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  type: string;
}

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
    PopoverTriggerDirective
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

  constructor() {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    // Mock data - replace with actual service call
    this.users = [
      {
        id: '1',
        name: 'Mario',
        surname: 'Rossi',
        email: 'mario.rossi@email.com',
        type: 'user'
      },
      {
        id: '2',
        name: 'Giulia',
        surname: 'Bianchi',
        email: 'giulia.bianchi@email.com',
        type: 'user'
      },
      {
        id: '3',
        name: 'Luca',
        surname: 'Verdi',
        email: 'luca.verdi@email.com',
        type: 'airline-admin'
      }
    ];
  }

  protected deleteUser(userId: string, ctx: any): void {
    this.isDeleteUserLoading = true;
    
    // Mock delete - replace with actual service call
    setTimeout(() => {
      this.users = this.users.filter(user => user.id !== userId);
      this.isDeleteUserLoading = false;
      ctx.close();
    }, 1000);
  }
} 
