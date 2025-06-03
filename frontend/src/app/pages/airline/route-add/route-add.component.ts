import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {NgIf} from '@angular/common';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-route-add',
  imports: [
    FormsModule,
    HlmInputDirective,
    HlmLabelDirective,
    NgIf,
    ReactiveFormsModule,
    HlmButtonDirective,
    RouterLink
  ],
  templateUrl: './route-add.component.html'
})
export class RouteAddComponent {

}
