import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

import { ListMessageComponent } from './template/message/list-message/list-message.component';
import { ListCallComponent } from './template/call/list-call/list-call.component';
import { ListContactComponent } from './template/contact/list-contact/list-contact.component';

import { User } from 'src/app/core/models/user';
import { AuthenticationService } from 'src/app/core/service/authentication.service';
import { CallService } from 'src/app/core/service/call.service';
import { ChatBoardService } from 'src/app/core/service/chat-board.service';
import { UserService } from 'src/app/core/service/user.service';
import { SignalRService } from 'src/app/core/service/signalR.service';
import { Constants } from 'src/app/core/utils/constants';
declare const $: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChild('listMessage', { static: true })
  listMessage!: ListMessageComponent;
  @ViewChild('listCall', { static: true }) listCall!: ListCallComponent;
  @ViewChild('listContact', { static: true })
  listContact!: ListContactComponent;

  currentUser: any = {};
  userProfile: User | any = {};

  tabControls: any[] = [
    {
      title: 'Message',
      iconClass: 'mdi-message-text',
    },
    {
      title: 'Call',
      iconClass: 'mdi-phone',
    },
    {
      title: 'Contacts',
      iconClass: 'mdi-account-box-outline',
    },
    {
      title: 'Notifications',
      iconClass: 'mdi-bell-outline',
    },
  ];

  tabIndexSelected: number = 0;

  memberInNewGroup: User[] = [];

  filter = {
    keySearch: '',
    groupName: '',
    group: null,
    contact: null,
    groupCall: null,
  };

  isLeftOpen = false;
  isAddUserToGroupMode: boolean = false;
  groupForAddUser: any = null;
  contactsToAddToGroup: any[] = [];

  constructor(
    private authService: AuthenticationService,
    private callService: CallService,
    private chatBoardService: ChatBoardService,
    private userService: UserService,
    private signalRService: SignalRService,
    private ngZone: NgZone,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.signalRService.startConnection();
    // listen for return message => process
    this.signalRService.hubConnection.on('messageHubListener', (data) => {
      console.log('messageHubListener: ', data);
      this.listMessage.getData();
    });
    // listen for return call => process
    this.signalRService.hubConnection.on('callHubListener', (data) => {
      console.log('callHubListener');
      this.openModalCall(data);
    });
  }

  clickTab(tabIndex: any) {
    this.tabIndexSelected = tabIndex;
  }

  onClickMessage(group: any) {
    this.filter.group = group;
    if (window.innerWidth <= 900) {
      this.isLeftOpen = false;
    }
  }

  onClickCall(groupCall: any) {
    this.filter.groupCall = groupCall;
  }

  onClickContact(contact: any) {
    this.filter.contact = contact;
    if (window.innerWidth <= 900) {
      this.isLeftOpen = false;
    }
  }

  //#region add new contact
  contactSearchs: User[] = [];
  openModalAddContact() {
    this.filter.keySearch = '';
    this.contactSearchs = [];
    $('#modalAddContact').modal();
  }

  searchContact() {
    this.userService.searchContact(this.filter.keySearch).subscribe({
      next: (response: any) => {
        this.contactSearchs = JSON.parse(response['data']);
      },
      error: (error) => console.log('error: ', error),
    });
  }

  submitAddContact(contact: any) {
    this.userService.addContact(contact).subscribe({
      next: (response: any) => {
        this.toastr.success('Contact added succesfully', 'Add contact');
        $('#modalAddContact').modal('hide');
        this.listContact.getContact();
      },
      error: (error) => console.log('error: ', error),
    });
  }

  //#endregion

  //#region update profile

  openModalProfile() {
    this.spinner.show();
    this.userService
      .getProfile()
      .pipe(
        finalize(() => {
          this.spinner.hide();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.userProfile = JSON.parse(response['data']);
          $('#modalProfile').modal();
        },
        error: (error) => console.log('error: ', error),
      });
  }

  onloadAvatar(img: any) {
    this.userProfile.Avatar = img;
    console.log('onloadAvatar');
  }

  updateProfile() {
    this.spinner.show();
    this.userService
      .updateProfile(this.userProfile)
      .pipe(
        finalize(() => {
          this.spinner.hide();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.userProfile = JSON.parse(response['data']);
          this.toastr.success('Updated succesfully', 'Personal information', {
            timeOut: 2000,
          });
          this.currentUser.Avatar = this.userProfile.Avatar;
          this.currentUser.FullName = this.userProfile.FullName;
          localStorage.setItem(
            Constants.LOCAL_STORAGE_KEY.SESSION,
            JSON.stringify(this.currentUser)
          );
          $('#modalProfile').modal('hide');
        },
        error: (error) => this.toastr.error('Update failed', 'Personal information', {
          timeOut: 2000,
        }),
      });
  }

  //#endregion

  //#region thêm mới nhóm chat

  openModalAddGroup() {
    this.isAddUserToGroupMode = false;
    this.filter.groupName = '';
    this.userService.getContact().subscribe({
      next: (response: any) => {
        this.memberInNewGroup = JSON.parse(response['data']);
        this.memberInNewGroup.forEach((x) => (x.fieldStamp1 = false));
        this.removeItemGroup(this.currentUser.FullName);
        this.uniqByFilterGroup();
        $('#modalAddGroup').modal();
      },
      error: (error) => console.log('error: ', error),
    });
  }

  removeItemGroup(obj: any) {
    this.memberInNewGroup = this.memberInNewGroup.filter(c => c.FullName !== obj)
  }
  uniqByFilterGroup() {
    this.memberInNewGroup = this.memberInNewGroup.filter(
      (value, index, array) =>
        index == array.findIndex((item) => item.FullName == value.FullName)
    );
  }

  addMemberToGroup(member: User) {
    member.fieldStamp1 = true;
  }

  removeMemberToGroup(member: User) {
    member.fieldStamp1 = false;
  }

  submitAddGroup() {
    if (this.filter.groupName == null || this.filter.groupName.trim() == '') {
      this.toastr.error('Group name contact is blank', 'Create groups', {
        timeOut: 2000,
      });
      return;
    }

    if (this.memberInNewGroup.filter((x) => x.fieldStamp1).length == 0) {
      this.toastr.error('Member list cannot be empty', 'Group member', {
        timeOut: 2000,
      });
      return;
    }

    this.chatBoardService
      .addGroup({
        Name: this.filter.groupName,
        Users: this.memberInNewGroup.filter((x) => x.fieldStamp1),
      })
      .subscribe({
        next: (response: any) => {
          this.toastr.success('Add success', 'Add to group', {
            timeOut: 2000,
          });
          $('#modalAddContact').modal('hide');
          this.listMessage.getData();
        },
        error: (error) => this.toastr.error('Add failure', 'Add to group', {
          timeOut: 2000,
        }),
      });
  }

  onAddUserToGroup(event: any) {
    this.isAddUserToGroupMode = true;
    this.groupForAddUser = event.group;
    // Fetch contacts not in the group
    this.userService.getContact().subscribe({
      next: (response: any) => {
        const allContacts = JSON.parse(response['data']) || [];
        const groupUserCodes = (this.groupForAddUser.Users || []).map((u: any) => u.Code);
        this.contactsToAddToGroup = allContacts.filter((c: any) => !groupUserCodes.includes(c.Code));
        this.memberInNewGroup = this.contactsToAddToGroup.map((c: any) => ({ ...c, fieldStamp1: false }));
        $('#modalAddGroup').modal();
      },
      error: (error) => {
        this.contactsToAddToGroup = [];
        this.memberInNewGroup = [];
        $('#modalAddGroup').modal();
      }
    });
  }

  submitAddUserToGroup() {
    if (!this.groupForAddUser || this.memberInNewGroup.filter((x) => x.fieldStamp1).length === 0) {
      this.toastr.error('Please select at least one user to add.', 'Add to group', { timeOut: 2000 });
      return;
    }
    const usersToAdd = this.memberInNewGroup.filter((x) => x.fieldStamp1);
    let addCount = 0;
    let errorCount = 0;
    usersToAdd.forEach((user, idx) => {
      this.chatBoardService.addUserToGroup(this.groupForAddUser.Code, user.Code).subscribe({
        next: () => {
          addCount++;
          if (addCount + errorCount === usersToAdd.length) {
            this.finishAddUserToGroup();
          }
        },
        error: () => {
          errorCount++;
          if (addCount + errorCount === usersToAdd.length) {
            this.finishAddUserToGroup();
          }
        }
      });
    });
  }

  finishAddUserToGroup() {
    $('#modalAddGroup').modal('hide');
    this.isAddUserToGroupMode = false;
    this.groupForAddUser = null;
    this.contactsToAddToGroup = [];
    this.memberInNewGroup = [];
    // Refresh group info in message detail if possible
    if (this.filter.group && typeof this.filter.group === 'object') {
      this.filter.group = Object.assign({}, this.filter.group);
    }
    this.toastr.success('Users added to group.', 'Add to group', { timeOut: 2000 });
  }

  openModalCall(url: any) {
    if (confirm('Incoming call from ' + url + '. Do you want to answer?')) {
      this.callService
        .joinVideoCall($('#inComingCallIframe').attr('src'))
        .subscribe({
          next: (response: any) => {
            $('#modalInComingCall').modal();
            $('#inComingCallIframe').attr('src', url);
          },
          error: (error) => console.log('error: ', error),
        });
    }
  }

  rejectCall() {
    $('#modalInComingCall').modal('hide');
    $('#inComingCallIframe').attr('src', '');
    this.listCall.getData();
  }

  cancelVideoCall() {
    this.callService
      .cancelVideoCall($('#outgoingCallIframe').attr('src'))
      .subscribe({
        next: (response: any) => {
          $('#modalOutgoingCall').modal('hide');
          $('#outgoingCallIframe').attr('src', '');
          this.listCall.getData();
        },
        error: (error) => console.log('error: ', error),
      });
  }

  navigate(path: string): void {
    this.ngZone.run(() => this.router.navigateByUrl(path)).then();
  }
}
