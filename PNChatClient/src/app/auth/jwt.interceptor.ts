import { Injectable } from "@angular/core";
import { AuthenticationService } from "../core/service/authentication.service";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()

export class JwtInterceptor implements HttpInterceptor {
    constructor(private authService: AuthenticationService) { }

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        let token = this.authService.getToken;
        let header: any = {};

        if (token != null) {
            header["Authorization"] = `Bearer ${token}`;
        }
        request = request.clone({
            setHeaders: header,
        });
        return next.handle(request);
    }
}