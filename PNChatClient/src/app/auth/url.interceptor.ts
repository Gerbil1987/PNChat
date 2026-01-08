import { Injectable } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from 'src/environments/environment';

@Injectable()
export class UrlInterceptor implements HttpInterceptor {
    constructor() { }

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        // Get current request URL
        const url = request.url;

        // If URL contains localhost, replace it with the server IP
        if (url.includes('localhost:5129')) {
            const newUrl = url.replace('localhost:5129', '197.242.158.172:5129');
            console.log(`Intercepted and replaced URL: ${url} -> ${newUrl}`);
            request = request.clone({
                url: newUrl
            });
        }
        
        return next.handle(request);
    }
}
