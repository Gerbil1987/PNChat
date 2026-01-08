import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { AppRoutingApi } from 'src/app/app-routing-api';
import { Constants } from '../utils/constants';
import { UrlHelper } from '../utils/url-helper';

@Injectable({
    providedIn: 'root',
})

export class AuthenticationService {
    constructor(private http: HttpClient) { }

    get getToken(): string | null {
        return localStorage.getItem(Constants.LOCAL_STORAGE_KEY.TOKEN)?.toString() ?? null;
    }

    get currentUserValue(): any {
        let session = localStorage.getItem(Constants.LOCAL_STORAGE_KEY.SESSION);

        if (session == null || session == undefined)
            return null;
        return JSON.parse(
            localStorage.getItem(Constants.LOCAL_STORAGE_KEY.SESSION)?.toString() ?? ""
        );
    }

    login(params: any) {
        // Use UrlHelper to ensure the correct URL is used
        const loginUrl = UrlHelper.ensureCorrectUrl(AppRoutingApi.Login);
        console.log('Login URL:', loginUrl);
        
        return this.http.post(loginUrl, params).pipe(
            map((response: any) => {
                localStorage.setItem(Constants.LOCAL_STORAGE_KEY.SESSION, response["data"]);
                localStorage.setItem(Constants.LOCAL_STORAGE_KEY.TOKEN, JSON.parse(response["data"])["Token"]);

                return response;
            })
        );
    }

    signUp(params: any) {
        // Use UrlHelper to ensure the correct URL is used
        const signUpUrl = UrlHelper.ensureCorrectUrl(AppRoutingApi.SignUp);
        console.log('SignUp URL:', signUpUrl);
        
        return this.http.post(signUpUrl, params);
    }
}