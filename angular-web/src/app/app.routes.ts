import { Routes } from '@angular/router';

import { AuthenticateComponent } from './authenticate/authenticate.component';
import { WatchControlComponent } from './watch-control/watch-control.component';
import { RedirectComponent } from './redirect/redirect.component';
import { MacroCreateComponent } from './macro/create/macro-create.component';
import { MacroMenuComponent } from './macro/menu/macro-menu.component';
import { PricingComponent } from './pricing/pricing.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: 'authenticate', component: AuthenticateComponent },
	{ path: 'pricing', component: PricingComponent },
	{ path: 'redirect', component: RedirectComponent},

	  // Protected routes with authGuard
	{ path: 'watch-control', component: WatchControlComponent, canActivate: [AuthGuard] },
	{ path: 'macro-menu', component: MacroMenuComponent, canActivate: [AuthGuard] },
	{ path: 'macro-create', component: MacroCreateComponent, canActivate: [AuthGuard] },
	{ path: '**', redirectTo: '/watch-control', pathMatch: 'full' },
];
