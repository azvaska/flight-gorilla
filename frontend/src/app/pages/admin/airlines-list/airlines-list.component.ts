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

// Mock airline interface - replace with actual interface
interface IAirline {
  id: string;
  airlineName: string;
  adminName: string;
  adminSurname: string;
  email: string;
}

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
    PopoverTriggerDirective
  ],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './airlines-list.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class AirlinesListComponent implements OnInit {
  protected airlines: IAirline[] = [];
  protected isDeleteAirlineLoading = false;

  constructor() {}

  ngOnInit(): void {
    this.loadAirlines();
  }

  private loadAirlines(): void {
    // Mock data - replace with actual service call
    this.airlines = [
      {
        id: '1',
        airlineName: 'Alitalia',
        adminName: 'Marco',
        adminSurname: 'Ferrari',
        email: 'marco.ferrari@alitalia.com'
      },
      {
        id: '2',
        airlineName: 'Ryanair',
        adminName: 'Sarah',
        adminSurname: 'Johnson',
        email: 'sarah.johnson@ryanair.com'
      },
      {
        id: '3',
        airlineName: 'Lufthansa',
        adminName: 'Hans',
        adminSurname: 'Mueller',
        email: 'hans.mueller@lufthansa.com'
      }
    ];
  }

  protected deleteAirline(airlineId: string, ctx: any): void {
    this.isDeleteAirlineLoading = true;
    
    // Mock delete - replace with actual service call
    setTimeout(() => {
      this.airlines = this.airlines.filter(airline => airline.id !== airlineId);
      this.isDeleteAirlineLoading = false;
      ctx.close();
    }, 1000);
  }
} 
