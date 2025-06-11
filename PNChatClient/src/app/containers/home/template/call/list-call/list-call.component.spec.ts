import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCallComponent } from './list-call.component';

describe('ListDetailComponent', () => {
  let component: ListCallComponent;
  let fixture: ComponentFixture<ListCallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListCallComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
