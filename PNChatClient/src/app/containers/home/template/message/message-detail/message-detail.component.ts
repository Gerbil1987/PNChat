import { Component, Input, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { saveAs } from 'file-saver';

import { Message } from 'src/app/core/models/message';
import { User } from 'src/app/core/models/user';
import { AuthenticationService } from 'src/app/core/service/authentication.service';
import { CallService } from 'src/app/core/service/call.service';
import { ChatBoardService } from 'src/app/core/service/chat-board.service';
import { SignalRService } from 'src/app/core/service/signalR.service';
import { NotificationService } from 'src/app/core/service/notification.service';
import { DataHelper } from 'src/app/core/utils/data-helper';

declare const $: any;

@Component({
  selector: 'app-message-detail',
  templateUrl: './message-detail.component.html',
  styleUrls: ['./message-detail.component.css'],
})
export class MessageDetailComponent implements OnInit {
  @Input() group!: any;
  @Input() contact: User | null = null;
  @Output() addUserToGroup = new EventEmitter<any>();
  @Output() groupUpdated = new EventEmitter<any>();  // Emit when group is updated after sending new direct message

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
    private signalRService: SignalRService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.isIosSafari = this.checkIosSafari();
    this.currentUser = this.authService.currentUserValue;
    this.signalRService.hubConnection.on('messageHubListener', (data) => {
      console.log('messageHubListener:', data);
      this.getMessage();
      
      // Show notification for incoming message
      this.handleIncomingMessageNotification(data);
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
    if (this.contact) {
      this.chatBoardService.getMessageByContact(this.contact.Code).subscribe({
        next: (response: any) => {
          this.messages = JSON.parse(response['data']);
          // Add showDelete property to each message
          this.messages.forEach((msg: any) => msg.showDelete = false);
        },
        error: (error) => console.log('error: ', error),
      });
    }
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
    // Get message from emoji area (not from ngModel which isn't updated by emoji library)
    let messageContent = '';
    
    try {
      const emojiArea = $("#my-text").data('emojioneArea');
      if (emojiArea) {
        messageContent = emojiArea.getText().trim();
        console.log('Got text from emojioneArea:', messageContent);
      } else {
        // Fallback to textarea value
        messageContent = $("#my-text").val()?.trim() || '';
        console.log('Got text from textarea:', messageContent);
      }
    } catch (e) {
      console.log('Error getting emoji area text, using textarea:', e);
      messageContent = $("#my-text").val()?.trim() || '';
    }

    console.log('Final messageContent:', messageContent);
    
    // Check if message is empty
    if (!messageContent || messageContent === '') {
      console.log('❌ Message is empty, returning');
      return;
    }

    // Check if we have a group or contact
    if (!this.group && !this.contact) {
      console.log('❌ No group or contact selected');
      return;
    }

    const formData = new FormData();

    console.log('✅ Creating FormData with message:', messageContent);

    // Determine if this is a direct message or group message
    // A direct message group has IsGroup: false (it's a SINGLE type group in the backend)
    const isDirectMessage = this.group && this.group.IsGroup === false;
    const isGroupMessage = this.group && this.group.IsGroup === true;
    const isNewDirectMessage = this.group && !this.group.Users; // New direct message has no Users array yet
    const isNewContactMessage = !this.group && this.contact; // New message to a contact with no group yet
    
    // Build the message data
    const messageData: any = {
      Content: messageContent,
      Type: 'text',
    };

    if (isNewContactMessage) {
      // Brand new direct message to a contact (no group exists yet)
      if (this.contact) {
        messageData.SendTo = this.contact.Code;
        console.log('✅ New contact message using SendTo:', this.contact.Code);
      }
    } else if (isDirectMessage) {
      // For direct messages, we need to set SendTo to identify the recipient
      let contactCode: string | null = null;
      
      console.log('DEBUG isDirectMessage - this.group:', this.group);
      console.log('DEBUG isDirectMessage - this.group.Users:', this.group?.Users);
      console.log('DEBUG isNewDirectMessage:', isNewDirectMessage);
      
      if (isNewDirectMessage) {
        // New direct message: group.Code is actually the recipient's user code
        contactCode = this.group.Code;
        console.log('DEBUG - New direct message, using group.Code as recipient:', contactCode);
      } else if (this.group && this.group.Users && this.group.Users.length > 0) {
        // Existing direct message group: extract the other user's code from Users array
        console.log('DEBUG - Found', this.group.Users.length, 'users in group');
        const otherUser = this.group.Users.find((u: any) => u.Code !== this.currentUser.Code);
        if (otherUser) {
          contactCode = otherUser.Code;
          console.log('DEBUG - Found other user:', otherUser.Code);
        } else {
          console.log('DEBUG - No other user found in group');
        }
      }
      
      // Fallback: use this.contact if available
      if (!contactCode && this.contact) {
        contactCode = this.contact.Code;
        console.log('DEBUG - Using contact as fallback:', contactCode);
      }
      
      if (contactCode) {
        messageData.SendTo = contactCode;
        console.log('✅ Direct message using SendTo:', contactCode);
      } else {
        console.log('⚠️ Direct message but could not determine contact code');
      }
    } else if (isGroupMessage) {
      // True group message - SendTo is not needed
      console.log('✅ Group message to group:', this.group?.Code);
    }

    formData.append('data', JSON.stringify(messageData));

    // For new direct messages (no existing group), send empty group code
    // The backend will use SendTo to find or create the direct message group
    let groupCodeToSend = '';
    if (this.group) {
      if (isNewDirectMessage) {
        console.log('✅ New direct message - sending empty groupCode, SendTo in payload');
        groupCodeToSend = '';
      } else {
        console.log('✅ Sending message with groupCode:', this.group.Code);
        groupCodeToSend = this.group.Code;
      }
    }
    
    console.log('✅ FormData contents - data field:', JSON.stringify(messageData));
    console.log('✅ GroupCode parameter:', groupCodeToSend || 'EMPTY STRING');
    
    this.chatBoardService
      .sendMessage(groupCodeToSend, formData)
      .subscribe({
        next: (response: any) => {
          console.log('✅ Message sent successfully:', response);
          this.textMessage = '';
          // Clear emoji area
          try {
            const emojiArea = $("#my-text").data('emojioneArea');
            if (emojiArea) {
              emojiArea.clear();
              console.log('Cleared emojioneArea');
            }
          } catch (e) {
            console.log('Emoji area clear error:', e);
          }
          $(".emojionearea-editor").html('');
          
          // If this was a new direct message, we need to fetch the updated group info
          // with the actual group code that was created by the backend
          if (isNewDirectMessage && this.contact) {
            console.log('✅ New direct message sent - fetching updated group info for:', this.contact.Code);
            this.chatBoardService.getChatBoardInfo('', this.contact.Code).subscribe({
              next: (response: any) => {
                const updatedGroupInfo = JSON.parse(response['data']);
                console.log('✅ Updated group info received:', updatedGroupInfo);
                // Update the group reference with the actual group code from the backend
                if (updatedGroupInfo && updatedGroupInfo.Code) {
                  this.group = updatedGroupInfo;
                  console.log('✅ Updated this.group with actual group code:', this.group.Code);
                  // Emit event to parent component to update the group
                  this.groupUpdated.emit(this.group);
                  // NOW refresh the message list after updating the group
                  this.getMessage();
                }
              },
              error: (error) => {
                console.error('Error fetching updated group info:', error);
              }
            });
          } else {
            // For existing conversations, just refresh the message list
            this.getMessage();
          }
        },
        error: (error) => {
          console.error('❌ Error sending message:', error);
          console.error('Error status:', error?.status);
          console.error('Error statusText:', error?.statusText);
          console.error('Full error response:', error);
          if (error?.error) {
            console.error('Error body:', error.error);
            console.error('Server error message:', typeof error.error === 'string' ? error.error : JSON.stringify(error.error));
          }
          // Log the group info for debugging
          console.log('DEBUG - Current group object:', JSON.stringify(this.group));
          console.log('DEBUG - Group code being sent:', groupCodeToSend || 'NONE');
          console.log('DEBUG - Contact object:', JSON.stringify(this.contact));
        },
      });
  }



  sendFile(event: any) {
    const isGroup = !!this.group;
    const isDirectMessage = this.group && this.group.IsGroup === false;
    const isGroupMessage = this.group && this.group.IsGroup === true;
    const isNewDirectMessage = this.group && !this.group.Users;
    const isNewContactMessage = !this.group && this.contact;
    
    if (event.target.files && event.target.files[0] && (isGroup || (this.contact && this.contact.Code))) {
      console.log('sendFile called - isGroup:', isGroup, 'isDirectMessage:', isDirectMessage, 'isNewContactMessage:', isNewContactMessage);
      let filesToUpload: any[] = [];
      for (let i = 0; i < event.target.files.length; i++) {
        filesToUpload.push(event.target.files[i]);
      }
      const formData = new FormData();
      Array.from(filesToUpload).map((file, index) => {
        formData.append('files', file, file.name);
      });
      const contentValue = this.textMessage && this.textMessage.trim() !== '' ? this.textMessage.trim() : 'file';
      
      // Build message data with proper SendTo handling
      const messageData: any = {
        Content: contentValue,
        Type: 'attachment',
      };
      
      if (isNewContactMessage) {
        // Brand new file to a contact with no group yet
        if (this.contact) {
          messageData.SendTo = this.contact.Code;
          console.log('✅ New contact file using SendTo:', this.contact.Code);
        }
      } else if (isDirectMessage) {
        // Direct message - set SendTo to recipient
        let contactCode: string | null = null;
        if (isNewDirectMessage) {
          // New direct message: group.Code is the recipient's user code
          contactCode = this.group.Code;
        } else if (this.group && this.group.Users && this.group.Users.length > 0) {
          // Existing direct message group: extract other user
          const otherUser = this.group.Users.find((u: any) => u.Code !== this.currentUser.Code);
          if (otherUser) {
            contactCode = otherUser.Code;
          }
        }
        
        if (!contactCode && this.contact) {
          contactCode = this.contact.Code;
        }
        
        if (contactCode) {
          messageData.SendTo = contactCode;
        }
      } else if (isGroupMessage) {
        // Group message - don't include SendTo
      }
      
      formData.append('data', JSON.stringify(messageData));
      
      // For new direct messages or new contact messages, send empty groupCode
      let groupCodeToSend = '';
      if (isGroup) {
        if (isNewDirectMessage) {
          groupCodeToSend = '';
        } else {
          groupCodeToSend = this.group.Code;
        }
      }
      // For new contact messages, groupCode is already empty
      
      this.chatBoardService
        .sendMessage(groupCodeToSend, formData)
        .subscribe({
          next: (response: any) => {
            console.log('✅ File sent successfully');
            this.textMessage = '';
            
            // If this was a new direct message or new contact message, fetch the updated group info first
            if ((isNewDirectMessage || isNewContactMessage) && this.contact) {
              console.log('✅ New direct message (file) sent - fetching updated group info for:', this.contact.Code);
              this.chatBoardService.getChatBoardInfo('', this.contact.Code).subscribe({
                next: (response: any) => {
                  const updatedGroupInfo = JSON.parse(response['data']);
                  if (updatedGroupInfo && updatedGroupInfo.Code) {
                    this.group = updatedGroupInfo;
                    console.log('✅ Updated this.group with actual group code (file):', this.group.Code);
                    // Emit event to parent component to update the group
                    this.groupUpdated.emit(this.group);
                    // NOW refresh the message list after updating the group
                    this.getMessage();
                  }
                },
                error: (error) => {
                  console.error('Error fetching updated group info (file):', error);
                }
              });
            } else {
              // For existing conversations, just refresh the message list
              this.getMessage();
            }
          },
          error: (error) => console.log('error: ', error),
        });
      // Reset input value so (change) will fire even for the same file
      event.target.value = '';
    }
  }

  sendImage(event: any) {
    const isGroup = !!this.group;
    const isDirectMessage = this.group && this.group.IsGroup === false;
    const isGroupMessage = this.group && this.group.IsGroup === true;
    const isNewDirectMessage = this.group && !this.group.Users;
    const isNewContactMessage = !this.group && this.contact;
    
    console.log('sendImage: isGroup', isGroup, 'isDirectMessage', isDirectMessage, 'isGroupMessage', isGroupMessage, 'isNewContactMessage', isNewContactMessage);
    if (event.target.files && event.target.files[0] && (isGroup || (this.contact && this.contact.Code))) {
      console.log('sendImage called');
      let filesToUpload: any[] = [];
      for (let i = 0; i < event.target.files.length; i++) {
        filesToUpload.push(event.target.files[i]);
      }
      const formData = new FormData();
      Array.from(filesToUpload).map((file, index) => {
        formData.append('files', file, file.name);
      });
      const contentValue = this.textMessage && this.textMessage.trim() !== '' ? this.textMessage.trim() : 'image';
      
      // Build message data with proper SendTo handling
      const messageData: any = {
        Content: contentValue,
        Type: 'media',
      };
      
      if (isNewContactMessage) {
        // Brand new image to a contact with no group yet
        if (this.contact) {
          messageData.SendTo = this.contact.Code;
          console.log('✅ New contact image using SendTo:', this.contact.Code);
        }
      } else if (isDirectMessage) {
        // Direct message - set SendTo to recipient
        let contactCode: string | null = null;
        if (isNewDirectMessage) {
          // New direct message: group.Code is the recipient's user code
          contactCode = this.group.Code;
        } else if (this.group && this.group.Users && this.group.Users.length > 0) {
          // Existing direct message group: extract other user
          const otherUser = this.group.Users.find((u: any) => u.Code !== this.currentUser.Code);
          if (otherUser) {
            contactCode = otherUser.Code;
          }
        }
        
        if (!contactCode && this.contact) {
          contactCode = this.contact.Code;
        }
        
        if (contactCode) {
          messageData.SendTo = contactCode;
        }
      } else if (isGroupMessage) {
        // Group message - don't include SendTo
      }
      
      formData.append('data', JSON.stringify(messageData));
      
      // For new direct messages or new contact messages, send empty groupCode
      let groupCodeToSend = '';
      if (isGroup) {
        if (isNewDirectMessage) {
          groupCodeToSend = '';
        } else {
          groupCodeToSend = this.group.Code;
        }
      }
      // For new contact messages, groupCode is already empty
      
      this.chatBoardService
        .sendMessage(groupCodeToSend, formData)
        .subscribe({
          next: (response: any) => {
            console.log('✅ Image sent successfully');
            this.textMessage = '';
            
            // If this was a new direct message or new contact message, fetch the updated group info first
            if ((isNewDirectMessage || isNewContactMessage) && this.contact) {
              console.log('✅ New direct message (image) sent - fetching updated group info for:', this.contact.Code);
              this.chatBoardService.getChatBoardInfo('', this.contact.Code).subscribe({
                next: (response: any) => {
                  const updatedGroupInfo = JSON.parse(response['data']);
                  if (updatedGroupInfo && updatedGroupInfo.Code) {
                    this.group = updatedGroupInfo;
                    console.log('✅ Updated this.group with actual group code (image):', this.group.Code);
                    // Emit event to parent component to update the group
                    this.groupUpdated.emit(this.group);
                    // NOW refresh the message list after updating the group
                    this.getMessage();
                  }
                },
                error: (error) => {
                  console.error('Error fetching updated group info (image):', error);
                }
              });
            } else {
              // For existing conversations, just refresh the message list
              this.getMessage();
            }
          },
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

  // Handle incoming message notifications
  private handleIncomingMessageNotification(data: any): void {
    console.log('📬 handleIncomingMessageNotification called with data:', data);
    
    if (!data) {
      console.log('❌ No data provided');
      return;
    }

    // Don't show notification for messages from current user
    if (data.CreatedBy === this.currentUser?.User) {
      console.log('⚠️ Skipping notification - message from current user:', data.CreatedBy);
      return;
    }

    const senderName = data.UserCreatedBy?.FullName || data.UserCreatedBy?.User || 'Unknown';
    const messageContent = data.Content || '';
    const senderAvatar = data.UserCreatedBy?.Avatar;

    console.log('📬 Processing notification for sender:', senderName);
    console.log('📬 Message content:', messageContent);
    console.log('📬 Current group:', this.group);
    console.log('📬 Current contact:', this.contact);

    // Check if this is an SOS emergency message
    if (this.isEmergencyMessage(messageContent)) {
      console.log('🚨 Detected emergency message');
      const emergencyType = messageContent.includes('Medical') ? 'medical' : 'incident';
      this.notificationService.showEmergencyNotification(senderName, emergencyType);
      // Also send to service worker for background notifications
      this.sendToServiceWorker({
        title: emergencyType === 'medical' ? '🚨 Medical Emergency!' : '⚠️ Incident Alert!',
        body: `${senderName} has reported a ${emergencyType === 'medical' ? 'medical' : 'incident'} emergency!`,
        icon: senderAvatar || '/pnchat.ico',
        badge: '/pnchat.ico',
        requireInteraction: true
      });
    } else if (this.group) {
      console.log('👥 Sending group notification for group:', this.group.Name || this.group.Code);
      // Show group notification
      this.notificationService.showGroupNotification(
        this.group.Name || 'Group',
        senderName,
        messageContent
      );
      // Also send to service worker for background notifications
      this.sendToServiceWorker({
        title: `${this.group.Name || 'Group'} - ${senderName}`,
        body: messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent,
        icon: senderAvatar || '/pnchat.ico',
        badge: '/pnchat.ico'
      });
    } else if (this.contact) {
      console.log('📨 Sending direct message notification for contact:', this.contact.Code);
      // Show direct message notification
      this.notificationService.showMessageNotification(
        senderName,
        messageContent,
        senderAvatar
      );
      // Also send to service worker for background notifications
      this.sendToServiceWorker({
        title: `New message from ${senderName}`,
        body: messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent,
        icon: senderAvatar || '/pnchat.ico',
        badge: '/pnchat.ico'
      });
    } else {
      console.warn('⚠️ No group or contact found for notification');
    }
  }

  // Send notification to service worker for background/mobile notifications
  private sendToServiceWorker(notificationData: any): void {
    console.log('🔄 Sending notification to service worker:', notificationData);
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log('✅ Service worker controller found, posting message');
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: notificationData.title,
        options: notificationData
      });
      console.log('✅ Message posted to service worker');
    } else {
      console.warn('⚠️ Service worker controller not available');
      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Workers not supported');
      }
      if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
        console.warn('⚠️ No service worker controller (not yet activated or no active SW)');
      }
    }
  }

  // Check if message is an emergency message
  private isEmergencyMessage(content: string): boolean {
    return !!(content && (content.includes('🚨') || content.includes('⚠️')));
  }
}
