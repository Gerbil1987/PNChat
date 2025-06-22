import {
  Component,
  NgZone,
  OnInit,
  ElementRef,
  Renderer2
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/core/service/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  formData!: FormGroup;
  formDataSignup!: FormGroup;
  submitted: boolean = false;
  submittedSiginup: boolean = false;
  signUp!: HTMLElement;
  signIn!: HTMLElement;
  container!: HTMLElement;

  constructor(
    private authService: AuthenticationService,
    private formBuilder: FormBuilder,
    private formBuilder2: FormBuilder,
    private ngZone: NgZone,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private elment: ElementRef,
    private renderer: Renderer2
  ) {}

  
  ngOnInit() {
    this.formData = this.formBuilder.group({
      UserName: ['', Validators.required],
      Password: ['', Validators.required],
    });

    this.formDataSignup = this.formBuilder2.group({
      FullName: ['', Validators.required],
      UserName: ['', Validators.required],
      Email: ['', Validators.required],
      Phone: ['', Validators.required],
      Password: ['', Validators.required],
    });
    this.signUp = this.elment.nativeElement.querySelector('#sign-up-btn');
    this.signIn = this.elment.nativeElement.querySelector('#sign-in-btn');
    this.container = this.elment.nativeElement.querySelector('.container');
  }

  onSubmitLogin() {
    this.submitted = true;
    if (this.formData.invalid) {
      console.log(this.formData.value);
      return;
    }

    this.spinner.show();
    this.authService
      .login(this.formData.getRawValue())
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (response: any) => {
          this.toastr.success('Login succesful', 'Success', {
            timeOut: 2000,
          });
          this.navigate('/');
        },
        error: (error) => this.toastr.error('Error, pleaes try again', 'Failure', {
          timeOut: 2000,
        }),
      });
  }

  onSubmitSignup() {
    this.submittedSiginup = true;
    if (this.formDataSignup.invalid) {
      console.log(this.formDataSignup.value)
      return;
    }
    this.spinner.show();
    this.authService
      .signUp(this.formDataSignup.getRawValue())
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({  
        next: (response: any) => {
          this.toastr.success('Account registration succesful', 'Success', {
            timeOut: 2000,
          });
          this.callFunLogin();
          console.log(response);
        },
        error: (error) => {
          let errorMsg = 'Registration Failed';
          if (error && error.error) {
            if (typeof error.error === 'string') {
              errorMsg = error.error;
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          }
          this.toastr.error(errorMsg);
        },
      });
  }

  navigate(path: string): void {
    this.ngZone.run(() => this.router.navigateByUrl(path)).then();
  }

  callFunSignup() {
    //console.log(this.signUp);
    this.renderer.addClass(this.container, 'sign-up-mode');
  }

  callFunLogin() {
    //console.log(this.signIn);
    this.renderer.removeClass(this.container, 'sign-up-mode');
  }
  
}

//# sourceMappingURL=emojionearea.min.map
