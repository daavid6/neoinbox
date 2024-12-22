import { Routes } from '@angular/router';

import { AuthenticateComponent } from './authenticate/authenticate.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { AuthCallbackComponent } from './auth-callback-component/auth-callback-component.component';

export const routes: Routes = [
	{ path: 'authenticate', component: AuthenticateComponent },
	{ path: 'permissions', component: PermissionsComponent },
	{ path: 'callback', component: AuthCallbackComponent },
	{ path: '', redirectTo: '/authenticate', pathMatch: 'full' },
];
