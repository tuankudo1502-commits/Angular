import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-insert-product',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './insert-product.html',
  styleUrl: './insert-product.css',
})
export class InsertProduct {
  innertForm = new FormGroup({
    name: new FormControl(''),
    price: new FormControl(0),
    describetion: new FormControl(''),
    img: new FormControl(''),
  });


  addProduct() {
    const product = this.innertForm.value;
    console.log('Product added:', product);
    // Here you would typically send the product data to your backend API
  }
}
