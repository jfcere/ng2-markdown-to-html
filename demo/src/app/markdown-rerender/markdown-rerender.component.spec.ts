import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownRerenderComponent } from './markdown-rerender.component';

describe('MarkdownRerenderComponent', () => {
  let component: MarkdownRerenderComponent;
  let fixture: ComponentFixture<MarkdownRerenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarkdownRerenderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownRerenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
