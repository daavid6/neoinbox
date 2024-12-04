import { Routes } from '@angular/router';

import { AuthenticateComponent } from './authenticate/authenticate.component';
import { PermissionsComponent } from './permissions/permissions.component';

export const routes: Routes = [
	{ path: 'authenticate', component: AuthenticateComponent },
	{ path: 'permissions', component: PermissionsComponent },
	{ path: '', redirectTo: '/authenticate', pathMatch: 'full' }
];
