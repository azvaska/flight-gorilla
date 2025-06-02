import { Component } from '@angular/core';
import {HlmButtonDirective} from "@spartan-ng/ui-button-helm";
import {HlmCardContentDirective, HlmCardDirective} from "@spartan-ng/ui-card-helm";
import {NgClass, NgOptimizedImage} from "@angular/common";
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink
  ],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  host: {
    class: 'block w-full h-fit',
  },
})
export class LandingPageComponent {

}
