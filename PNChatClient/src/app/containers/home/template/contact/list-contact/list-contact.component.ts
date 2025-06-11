import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { User } from 'src/app/core/models/user';
import { AuthenticationService } from 'src/app/core/service/authentication.service';
import { UserService } from 'src/app/core/service/user.service';

@Component({
  selector: 'app-list-contact',
  templateUrl: './list-contact.component.html',
  styleUrls: ['./list-contact.component.css'],
})
export class ListContactComponent implements OnInit {
  @Output() onClick = new EventEmitter<User>();

  contacts: User[] = [];
  currentUser: any = {};
  itemIndexSelected: number = -1;

  constructor(
    private userService: UserService,
    private authService: AuthenticationService
  ) {}

  ngOnInit() {
    this.getContact();
    this.currentUser = this.authService.currentUserValue;
  }

  getContact() {
    this.userService.getContact().subscribe({
      next: (response: any) => {
        this.contacts = JSON.parse(response['data']);

        this.removeItem(this.currentUser.FullName);
        this.uniqByFilter();
        this.itemIndexSelected = -1;
      },
      error: (error) => console.log('error: ', error),
    });
  }

  openContact(indexContact: any) {
    this.itemIndexSelected = indexContact;
    this.onClick.emit(this.contacts[indexContact]);
  }

  removeItem(obj: any) {
    this.contacts = this.contacts.filter((c) => c.FullName !== obj);
  }

  uniqByFilter() {
    this.contacts = this.contacts.filter(
      (value, index, array) =>
        index == array.findIndex((item) => item.FullName == value.FullName)
    );
  }
}
