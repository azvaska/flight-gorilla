import { AuthService, AuthUser } from '@/app/auth/auth.service';
import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterOutlet, HlmCardDirective],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  host: {
    class: 'block w-full h-fit',
  },
})
export class AdminSidebarComponent {

  protected pageTitle = '';

  protected user: AuthUser | null = null;

  constructor(private router: Router, private route: ActivatedRoute, private authService: AuthService) {
    this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      const child = this.route.firstChild?.snapshot;
      this.pageTitle = child?.data?.['pageTitle'] || '';
    });

    
    this.authService.user$.subscribe((user) => {
      this.user = user;
    });
  }

  protected readonly routes = [
    {
      label: 'Users',
      path: '/users', 
    },
    {
      label: 'Airlines',
      path: '/airlines',
    },
  ];

} 
