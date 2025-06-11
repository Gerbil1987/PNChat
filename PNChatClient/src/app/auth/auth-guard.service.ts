import { Injectable, NgZone } from "@angular/core";
import { Router, CanActivate } from '@angular/router';
import { AuthenticationService } from "../core/service/authentication.service";


@Injectable({
    providedIn: 'root'
})

export class AuthGuardService implements CanActivate {
    constructor(
        private ngZone: NgZone,
        private router: Router,
        private authService: AuthenticationService
    ) { }
    
    canActivate() {
        const token = this.authService.getToken;
        if (token == null) {
            this.navigate("/Login");
            return false;
        }
        return true;
    }

    public navigate(path: string) : void {
        this.ngZone.run(() => this.router.navigateByUrl(path)).then();
    }
}