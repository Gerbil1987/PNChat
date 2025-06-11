import { Component, Input, SimpleChanges } from '@angular/core';
import { Call } from 'src/app/core/models/call';
import { GroupCall } from 'src/app/core/models/group-call';
import { CallService } from 'src/app/core/service/call.service';

declare const $: any;
@Component({
  selector: 'app-call-detail',
  templateUrl: './call-detail.component.html',
  styleUrls: ['./call-detail.component.css']
})
export class CallDetailComponent {
  @Input() groupCall!: any;

  calls: Call[] = [];

  constructor(
    private callService: CallService
  ) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {
    if ("groupCall" in changes) {
      this.getGroupCallDetail();
    }
  }

  getGroupCallDetail() {
    if (this.groupCall == null)
      return;

    this.callService.getCallHistoryById(this.groupCall.Code)
      .subscribe({
        next: (response: any) => this.calls = JSON.parse(response["data"]),
        error: (error) => console.log('error: ', error),
      });
  }

  callVideo(code: any) {
    this.callService.call(code)
      .subscribe({
        next: (response: any) => {
          let data = JSON.parse(response["data"]);
          $("#outgoingCallIframe").attr("src", data);
          $("#modalOutgoingCall").modal();
          console.log('callVideo: ', data)
        },
        error: (error) => console.log('error: ', error),
      });
  }
}