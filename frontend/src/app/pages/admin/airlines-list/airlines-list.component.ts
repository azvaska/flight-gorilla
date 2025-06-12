import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { IAdminAirline } from '@/types/admin/airline';
import { toast } from 'ngx-sonner';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';

@Component({
  selector: 'app-airlines-list',
  imports: [
    CommonModule,
    RouterLink,
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
  templateUrl: './airlines-list.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class AirlinesListComponent implements OnInit {
  protected airlines: IAdminAirline[] = [];
  protected isDeleteAirlineLoading = false;
  protected isLoadingAirlines = false;

  constructor(private adminFetchService: AdminFetchService) {}

  ngOnInit(): void {
    this.loadAirlines();
  }

  private loadAirlines(): void {
    this.isLoadingAirlines = true;
    
    this.adminFetchService.getAirlines().subscribe({
      next: (airlines) => {
        this.airlines = airlines;
        this.isLoadingAirlines = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle compagnie aeree:', error);
        this.isLoadingAirlines = false;
      }
    });
  }

  protected deleteAirline(airlineId: string, ctx: any): void {
    this.isDeleteAirlineLoading = true;
    
    this.adminFetchService.deleteAirline(airlineId).subscribe({
      next: () => {
        this.airlines = this.airlines.filter(airline => airline.id !== airlineId);
        this.isDeleteAirlineLoading = false;
        ctx.close();
      },
      error: (error) => {
        console.error('Errore nella cancellazione della compagnia aerea:', error);
        this.isDeleteAirlineLoading = false;
        
        // Check if the error is a 409 Conflict
        if (error?.status === 409) {
          toast('Cannot delete this element', {
            description:
              'This airline cannot be deleted because it is currently in use.',
          });
        } else {
          toast('Unknown error', {
            description: 'An unexpected error occurred while deleting the airline.',
          });
        }
        
        ctx.close();
      }
    });
  }
} 
