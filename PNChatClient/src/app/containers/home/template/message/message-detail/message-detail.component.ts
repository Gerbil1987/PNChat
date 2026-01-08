import { Component, Input, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { saveAs } from 'file-saver';

import { Message } from 'src/app/core/models/message';
import { User } from 'src/app/core/models/user';
import { AuthenticationService } from 'src/app/core/service/authentication.service';
import { CallService } from 'src/app/core/service/call.service';
import { ChatBoardService } from 'src/app/core/service/chat-board.service';
import { SignalRService } from 'src/app/core/service/signalR.service';
import { DataHelper } from 'src/app/core/utils/data-helper';

declare const $: any;

@Component({
  selector: 'app-message-detail',
  templateUrl: './message-detail.component.html',
  styleUrls: ['./message-detail.component.css'],
})
export class MessageDetailComponent implements OnInit {
  @Input() group!: any;
  @Input() contact!: User;
  @Output() addUserToGroup = new EventEmitter<any>();

  currentUser: any = {};
  messages: Message[] = [];
  textMessage: string = '';
  groupInfo: any = null;
  isContactInfoOpen = false;
  addUserModalOpen = false;
  contactsToAdd: any[] = [];
  selectedContactCode: string = '';
  userToRemove: any = null;
  showRemoveUserModal = false;
  showDeleteMenu = false;
  deleteMenuPosition = { x: 0, y: 0 };
  selectedMessage: Message | null = null;
  isIosSafari: boolean = false;
  showGroupMenu = false;
  selectedMember: any = null;

  constructor(
    private callService: CallService,
    private chatBoardService: ChatBoardService,
    private authService: AuthenticationService,
    private signalRService: SignalRService
  ) {}

  ngOnInit() {
    this.isIosSafari = this.checkIosSafari();
    this.currentUser = this.authService.currentUserValue;
    this.signalRService.hubConnection.on('messageHubListener', (data) => {
      console.log('messageHubListener:', data);
      this.getMessage();
    });
    const self = this;
    $("#my-text").emojioneArea({
      events: {
        keydown: function (editor: any, event: KeyboardEvent) {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            self.sendMessage();
          }
        }
      }
    });
    $(document).off('keydown.emojionearea');
  }

  checkIosSafari(): boolean {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    return isIOS && isSafari;
  }

  mess() {

  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getMessage();
    this.getChatBoardInfo();
    $('.main-box-chat').removeClass('box-contact-info-opened');
  }

  getChatBoardInfo() {
    this.chatBoardService
      .getChatBoardInfo(
        this.group == null ? '' : this.group.Code,
        this.contact == null ? '' : this.contact.Code
      )
      .subscribe({
        next: (response: any) =>
          (this.groupInfo = JSON.parse(response['data'])),
        error: (error) => console.log('error: ', error),
      });
  }

  getMessage() {
    if (this.group != null) {
      this.getMessageByGroup();
    } else if (this.contact != null) {
      this.getMessageByContact();
    }
  }

  getMessageByGroup() {
    this.chatBoardService.getMessageByGroup(this.group?.Code).subscribe({
      next: (response: any) => {
        this.messages = JSON.parse(response['data']);
        // Add showDelete property to each message
        this.messages.forEach((msg: any) => msg.showDelete = false);
      },
      error: (error) => console.log('error: ', error),
    });
  }

  getMessageByContact() {
    this.chatBoardService.getMessageByContact(this.contact.Code).subscribe({
      next: (response: any) => {
        this.messages = JSON.parse(response['data']);
        // Add showDelete property to each message
        this.messages.forEach((msg: any) => msg.showDelete = false);
      },
      error: (error) => console.log('error: ', error),
    });
  }

  toggleContact() {
    this.isContactInfoOpen = !this.isContactInfoOpen;
  }

  closeContactInfo() {
    this.isContactInfoOpen = false;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    this.textMessage = `${this.textMessage}${$("#my-text").emojioneArea({

    }).val()}`;
    if (this.textMessage == null || this.textMessage.trim() == '') return;
    const formData = new FormData();

    formData.append(
      'data',
      JSON.stringify({
        SendTo: this.contact == null ? '' : this.contact.Code,
        Content: this.textMessage.trim(),
        Type: 'text',
      })
    );

    this.chatBoardService
      .sendMessage(this.group == null ? '' : this.group.Code, formData)
      .subscribe({
        next: (response: any) => (this.textMessage = ''),
        error: (error) => console.log('error: ', error),
      });

      $(".emojionearea-editor").html('');
  }



  sendFile(event: any) {
    const isGroup = !!this.group;
    const sendTo = isGroup ? '' : (this.contact && this.contact.Code ? this.contact.Code : '');
    if (event.target.files && event.target.files[0] && (isGroup || sendTo)) {
      console.log('sendFile called', event.target.files, 'sendTo', sendTo, 'isGroup', isGroup);
      let filesToUpload: any[] = [];
      for (let i = 0; i < event.target.files.length; i++) {
        filesToUpload.push(event.target.files[i]);
      }
      const formData = new FormData();
      Array.from(filesToUpload).map((file, index) => {
        formData.append('files', file, file.name);
      });
      const contentValue = this.textMessage && this.textMessage.trim() !== '' ? this.textMessage.trim() : 'file';
      formData.append(
        'data',
        JSON.stringify({
          SendTo: sendTo,
          Content: contentValue,
          Type: 'attachment',
        })
      );
      this.chatBoardService
        .sendMessage(isGroup ? this.group.Code : '', formData)
        .subscribe({
          next: (response: any) => (this.textMessage = ''),
          error: (error) => console.log('error: ', error),
        });
      // Reset input value so (change) will fire even for the same file
      event.target.value = '';
    }
  }

  sendImage(event: any) {
    const isGroup = !!this.group;
    const sendTo = isGroup ? '' : (this.contact && this.contact.Code ? this.contact.Code : '');
    console.log('sendImage: contact', this.contact, 'contact.Code', this.contact && this.contact.Code, 'sendTo', sendTo, 'isGroup', isGroup);
    if (event.target.files && event.target.files[0] && (isGroup || sendTo)) {
      console.log('sendImage called', event.target.files, 'sendTo', sendTo, 'isGroup', isGroup);
      let filesToUpload: any[] = [];
      for (let i = 0; i < event.target.files.length; i++) {
        filesToUpload.push(event.target.files[i]);
      }
      const formData = new FormData();
      Array.from(filesToUpload).map((file, index) => {
        formData.append('files', file, file.name);
      });
      const contentValue = this.textMessage && this.textMessage.trim() !== '' ? this.textMessage.trim() : 'image';
      formData.append(
        'data',
        JSON.stringify({
          SendTo: sendTo,
          Content: contentValue,
          Type: 'media',
        })
      );
      this.chatBoardService
        .sendMessage(isGroup ? this.group.Code : '', formData)
        .subscribe({
          next: (response: any) => (this.textMessage = ''),
          error: (error) => console.log('error: ', error),
        });
      // Reset input value so (change) will fire even for the same file
      event.target.value = '';
    }
  }

  updateGroupAvatar(evt: any) {
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length === 0) {
      return;
    }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        var bytes = new Uint8Array(e.target.result);
        let img = 'data:image/png;base64,' + DataHelper.toBase64(bytes);

        this.chatBoardService
          .updateGroupAvatar({
            Code: this.groupInfo.Code,
            Avatar: img,
          })
          .subscribe({
            next: (response: any) => {
              const grp = JSON.parse(response['data']);
              this.groupInfo.Avatar = grp.Avatar;
              this.group.Avatar = grp.Avatar;
            },
            error: (error) => console.log('error: ', error),
          });
      } catch (error) {
        alert('Lỗi ảnh');
      }
    };
    reader.readAsArrayBuffer(target.files[0]);
  }

  downloadFile(path: any, fileName: any) {
    this.chatBoardService.downloadFileAttachment(path).subscribe({
      next: (response) => saveAs(response, fileName),
      error: (error) => console.log('error: ', error),
    });
  }

  callVideo() {
    this.callService.call(this.groupInfo.Code).subscribe({
      next: (response: any) => {
        let data = JSON.parse(response['data']);
        $('#outgoingCallIframe').attr('src', data);
        $('#modalOutgoingCall').modal();
        console.log('callVideo', data);
      },
      error: (error) => console.log('error: ', error),
    });
  }

  setCursorToStart(event: any) {
    const textarea = event.target;
    if (textarea && textarea.setSelectionRange) {
      setTimeout(() => textarea.setSelectionRange(0, 0), 0);
    }
  }

  openAddUserToGroup() {
    // Fetch contacts not already in the group
    this.addUserToGroup.emit({ group: this.groupInfo });
  }

  closeAddUserModal() {
    this.addUserModalOpen = false;
    this.selectedContactCode = '';
  }

  addSelectedContactToGroup() {
    if (!this.selectedContactCode) return;
    this.chatBoardService.addUserToGroup(this.groupInfo.Code, this.selectedContactCode).subscribe({
      next: () => {
        this.closeAddUserModal();
        this.getChatBoardInfo(); // Refresh group info
      },
      error: () => {
        alert('Failed to add user to group');
      }
    });
  }

  canRemoveUser(member: any): boolean {
    // Only allow removing if not the current user (or add admin logic here)
    return this.currentUser?.User !== member.Code;
  }

  confirmRemoveUser(member: any) {
    this.userToRemove = member;
    this.showRemoveUserModal = true;
  }

  removeUserFromGroup() {
    if (!this.userToRemove) return;
    this.chatBoardService.removeUserFromGroup(this.groupInfo.Code, this.userToRemove.Code).subscribe({
      next: () => {
        this.showRemoveUserModal = false;
        this.userToRemove = null;
        this.getChatBoardInfo(); // Refresh group info
      },
      error: () => {
        alert('Failed to remove user from group');
      }
    });
  }

  onMessageRightClick(event: MouseEvent, message: Message) {
    event.preventDefault();
    this.showDeleteMenu = true;
    this.deleteMenuPosition = { x: event.clientX, y: event.clientY };
    this.selectedMessage = message;
    document.addEventListener('click', this.closeDeleteMenu);
  }

  closeDeleteMenu = () => {
    this.showDeleteMenu = false;
    this.selectedMessage = null;
    document.removeEventListener('click', this.closeDeleteMenu);
  };

  deleteMessage(message: Message) {
    this.showDeleteMenu = false;
    if (!message) return;
    this.chatBoardService.deleteMessage(message.Id).subscribe({
      next: () => {
        this.getMessage();
      },
      error: (err) => {
        alert('Failed to delete message: ' + (err?.error?.message || err));
      }
    });
  }

  toggleGroupMenu() {
    this.showGroupMenu = !this.showGroupMenu;
  }

  leaveGroup() {
    // Implement actual leave group logic here
    alert('Leave group functionality not yet implemented.');
  }

  // Remove these methods if not needed, or add empty stubs to fix the error
  onImageInputChange(event: any) {}
  onImageInputClicked() {}

  handleRemoveUser(member: any) {
    if (this.groupInfo.CreatedBy === this.currentUser.User) {
      this.confirmRemoveUser(member);
    } else {
      alert('Only the admin can delete members from a chat.');
    }
  }

  // Send medical emergency message with location and phone number to SOS group
  sendMedicalEmergency() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const name = this.currentUser?.FullName || this.currentUser?.User || 'Unknown';
        const phone = this.currentUser?.Phone || '';
        const message = `🚨 Medical emergency (${name})\nLocation: https://maps.google.com/?q=${lat},${lng}\nContact ${phone}`;
        const formData = new FormData();
        formData.append(
          'data',
          JSON.stringify({
            SendTo: '',
            Content: message,
            Type: 'text',
          })
        );
        this.chatBoardService
          .sendMessage(this.groupInfo.Code, formData)
          .subscribe({
            next: () => {},
            error: (error) => alert('Failed to send medical emergency'),
          });
      },
      (error) => {
        alert('Unable to retrieve your location');
      }
    );
  }

  // Send incident report message with location and phone number to SOS group
  sendIncidentReport() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const name = this.currentUser?.FullName || this.currentUser?.User || 'Unknown';
        const phone = this.currentUser?.Phone || '';
        const message = `⚠️ Incident (${name})\nLocation: https://maps.google.com/?q=${lat},${lng}\nContact ${phone}`;
        const formData = new FormData();
        formData.append(
          'data',
          JSON.stringify({
            SendTo: '',
            Content: message,
            Type: 'text',
          })
        );
        this.chatBoardService
          .sendMessage(this.groupInfo.Code, formData)
          .subscribe({
            next: () => {},
            error: (error) => alert('Failed to send incident report'),
          });
      },
      (error) => {
        alert('Unable to retrieve your location');
      }
    );
  }
}
