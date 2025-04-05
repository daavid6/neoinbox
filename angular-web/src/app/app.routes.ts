import { Routes } from '@angular/router';

import { AuthenticateComponent } from './authenticate/authenticate.component';
import { WatchControlComponent } from './watch-control/watch-control.component';
import { RedirectComponent } from './redirect/redirect.component';
import { MacroCreateComponent } from './macro/create/macro-create.component';
import { MacroMenuComponent } from './macro/menu/macro-menu.component';
import { PricingComponent } from './pricing/pricing.component';

export const routes: Routes = [
	{ path: 'authenticate', component: AuthenticateComponent },
	{ path: 'pricing', component: PricingComponent },
	{ path: 'watch-control', component: WatchControlComponent },
	{ path: 'redirect', component: RedirectComponent },
	{ path: 'macro-menu', component: MacroMenuComponent },
	{ path: 'macro-create', component: MacroCreateComponent },
	{ path: '**', redirectTo: '/watch-control', pathMatch: 'full' },
];
