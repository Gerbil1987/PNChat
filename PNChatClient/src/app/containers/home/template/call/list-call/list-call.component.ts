import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GroupCall } from 'src/app/core/models/group-call';
import { CallService } from 'src/app/core/service/call.service';

declare const $: any;
@Component({
  selector: 'app-list-call',
  templateUrl: './list-call.component.html',
  styleUrls: ['./list-call.component.css']
})
export class ListCallComponent implements OnInit {

  @Output() onClick = new EventEmitter<GroupCall>();
  
  datas: GroupCall[] = [];
  groupCallSelected!: string;

  constructor(
    private callService: CallService
  ) { }

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.callService.getCallHistory()
    .subscribe({
      next: (response: any) => this.datas = JSON.parse(response["data"]),
      error: (error) => console.log('error: ', error),
    });
  }

  openCall(key: any) {
    this.groupCallSelected = key;
    this.onClick.emit(this.datas.find(x => x.Code == key));
  }

  callVideo(code: any) {
    this.callService.call(code)
    .subscribe({
      next: (response: any) => {
        let data = JSON.parse(response["data"]);
        $("#outgoingCallIframe").attr("src", data);
        $("#modalOutgoingCall").modal();
      },
      error: (error) => console.log('error: ', error),
    });
  }
}
