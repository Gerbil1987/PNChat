import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './containers/login/login.component';
import { LogoutComponent } from './containers/logout/logout.component';
import { HomeComponent } from './containers/home/home.component';
import { AuthGuardService } from './auth/auth-guard.service';
import { PageNotFoundComponent } from './containers/page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: "Login",
    component: LoginComponent
  },
  {
    path: "Logout",
    component: LogoutComponent
  },
  {
    path: "",
    component: HomeComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: "**",
    component: PageNotFoundComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
