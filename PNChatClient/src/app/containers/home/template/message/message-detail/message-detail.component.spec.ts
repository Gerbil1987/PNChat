import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MessageDetailComponent } from './message-detail.component';
import { Component } from '@angular/core';
import { CallService } from 'src/app/core/service/call.service';
import { ChatBoardService } from 'src/app/core/service/chat-board.service';

// Stub for DefaultComponent
@Component({selector: 'app-default', template: ''})
class DefaultComponent {}

const mockSomeService = {
  on: jasmine.createSpy('on')
};

describe('MessageDetailComponent', () => {
  let component: MessageDetailComponent;
  let fixture: ComponentFixture<MessageDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MessageDetailComponent, DefaultComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CallService, useValue: mockSomeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
