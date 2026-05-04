import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdminCategories } from './admin-categories';
import { CategoryService } from '../../app/services/category.service';

describe('AdminCategories', () => {
  let component: AdminCategories;
  let fixture: ComponentFixture<AdminCategories>;

  beforeEach(async () => {
    const categoryServiceMock = {
      getCategories: () => of({ success: true, data: [] }),
      createCategory: () => of({ success: true, data: null }),
      updateCategory: () => of({ success: true, data: null }),
      deleteCategory: () => of({ success: true, data: null }),
    };

    await TestBed.configureTestingModule({
      imports: [AdminCategories],
      providers: [{ provide: CategoryService, useValue: categoryServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategories);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
