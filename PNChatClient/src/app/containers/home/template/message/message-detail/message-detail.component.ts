import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
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

  currentUser: any = {};
  messages: Message[] = [];
  textMessage: string = '';
  groupInfo: any = null;
  isContactInfoOpen = false;

  constructor(
    private callService: CallService,
    private chatBoardService: ChatBoardService,
    private authService: AuthenticationService,
    private signalRService: SignalRService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.signalRService.hubConnection.on('messageHubListener', (data) => {
      console.log('messageHubListener:', data);
      this.getMessage();
    });
    $("#my-text").emojioneArea({
      events: {
        keydown: function (editor: any, event: KeyboardEvent) {
          // No-op: handled below
        }
      }
    });
    // Attach keydown handler to emojioneArea editor for Enter key
    setTimeout(() => {
      $(document).off('keydown.emojionearea'); // Remove previous handler if any
      $(document).on('keydown.emojionearea', '.emojionearea-editor', (event: any) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.sendMessage();
        }
      });
    }, 0);
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
      next: (response: any) => (this.messages = JSON.parse(response['data'])),
      error: (error) => console.log('error: ', error),
    });
  }

  getMessageByContact() {
    this.chatBoardService.getMessageByContact(this.contact.Code).subscribe({
      next: (response: any) => (this.messages = JSON.parse(response['data'])),
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

  onImageInputChange(event: any) {
    console.log('onImageInputChange fired', event);
  }

  onImageInputClicked() {
    console.log('image input clicked');
  }
}
