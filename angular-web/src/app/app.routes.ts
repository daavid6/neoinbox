import { Routes } from '@angular/router';

import { AuthenticateComponent } from './authenticate/authenticate.component';
import { WatchControlComponent } from './watch-control/watch-control.component';
import { AuthCallbackComponent } from './auth-callback-component/auth-callback-component.component';

export const routes: Routes = [
	{ path: 'authenticate', component: AuthenticateComponent },
	{ path: 'watch-control', component: WatchControlComponent },
	{ path: 'callback', component: AuthCallbackComponent },
	{ path: '', redirectTo: '/authenticate', pathMatch: 'full' },
];
