import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Group } from 'src/app/core/models/group';
import { ChatBoardService } from 'src/app/core/service/chat-board.service';

@Component({
  selector: 'app-list-message',
  templateUrl: './list-message.component.html',
  styleUrls: ['./list-message.component.css'],
})
export class ListMessageComponent implements OnInit {
  @Output() onClick = new EventEmitter<Group>();

  datas: Group[] = [];
  groupSelected!: string;

  constructor(private chatBoardService: ChatBoardService) {}

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.chatBoardService.getHistory().subscribe({
      next: (respone: any) => (this.datas = JSON.parse(respone['data'])),
      error: (error) => console.log('error: ', error),
    });
  }

  openMessage(groupCode: any) {
    this.groupSelected = groupCode;
    this.onClick.emit(this.datas.find((x) => x.Code == groupCode));
  }
}
