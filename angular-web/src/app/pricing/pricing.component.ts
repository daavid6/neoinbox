import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';

@Component({
	selector: 'app-pricing',
	imports: [MatToolbarModule, RouterLink, MatIcon],
	templateUrl: './pricing.component.html',
	styleUrl: './pricing.component.css',
})
export class PricingComponent {}
