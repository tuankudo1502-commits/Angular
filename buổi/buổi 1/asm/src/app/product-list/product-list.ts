import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Product } from '../../interfaces/product';
import { ProductItem } from '../product-item/product-item';
import { CategoryService, Category } from '../services/category.service';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FormsModule, ProductItem],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  // Danh sách sản phẩm từ API
  allProducts: Product[] = [];

  // Danh sách sản phẩm hiển thị sau khi lọc
  filteredProducts: Product[] = [];
  isLoading: boolean = true;

  // Filter options
  selectedGame: string = 'all';
  selectedRarity: string = 'all';
  selectedCategory: string = 'all';
  searchKeyword: string = '';
  sortOption: string = 'default';

  // Filter lists
  games: string[] = ['Valorant', 'CS2', 'Delta Force'];
  rarities: string[] = ['Premium', 'Deluxe', 'Covert', 'Ultra', 'Legendary', 'Ancient'];
  categories: Category[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
  ) {}

  ngOnInit() {
    this.allProducts = (this.route.snapshot.data['products'] as Product[] | undefined) ?? [];

    // Load categories
    this.categoryService
      .getCategories(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categories = response.data || [];
        },
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const gameFromUrl = params.get('game');
        const rarityFromUrl = params.get('rarity');
        const categoryFromUrl = params.get('category');
        const searchFromUrl = params.get('search');
        const sortFromUrl = params.get('sort');

        this.selectedGame = gameFromUrl && this.games.includes(gameFromUrl) ? gameFromUrl : 'all';
        this.selectedRarity =
          rarityFromUrl && this.rarities.includes(rarityFromUrl) ? rarityFromUrl : 'all';
        this.selectedCategory = categoryFromUrl || 'all';
        this.searchKeyword = searchFromUrl?.trim() ?? '';

        const allowedSortOptions = ['default', 'price-asc', 'price-desc', 'name-asc', 'name-desc'];
        this.sortOption =
          sortFromUrl && allowedSortOptions.includes(sortFromUrl) ? sortFromUrl : 'default';

        this.applyFilters();
      });
  }

  applyFilters() {
    let result = [...this.allProducts];

    // Filter by active status
    result = result.filter((p) => p.isActive !== false);

    // Filter by category
    if (this.selectedCategory !== 'all') {
      result = result.filter((p) => {
        const productCategory = p.category;
        if (typeof productCategory === 'string') {
          return productCategory === this.selectedCategory;
        } else if (productCategory && typeof productCategory === 'object' && '_id' in productCategory) {
          return productCategory._id === this.selectedCategory;
        }
        return false;
      });
    }

    // Filter by game
    if (this.selectedGame !== 'all') {
      result = result.filter((p) => p.game === this.selectedGame);
    }

    // Filter by rarity
    if (this.selectedRarity !== 'all') {
      result = result.filter((p) => p.rarity === this.selectedRarity);
    }

    // Filter by search keyword
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(keyword));
    }

    // Sort products
    result = this.sortProducts(result);

    this.filteredProducts = result;
    this.currentPage = 1;
    this.updatePagination();
  }

  sortProducts(products: Product[]): Product[] {
    switch (this.sortOption) {
      case 'price-asc':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...products].sort((a, b) => b.price - a.price);
      case 'name-asc':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return [...products].sort((a, b) => b.name.localeCompare(a.name));
      default:
        return products;
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    if (this.totalPages === 0) {
      this.totalPages = 1;
    }
  }

  getPaginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  }

  resetFilters() {
    this.selectedGame = 'all';
    this.selectedRarity = 'all';
    this.selectedCategory = 'all';
    this.searchKeyword = '';
    this.sortOption = 'default';
    this.applyFilters();
  }

  getTotalProducts(): number {
    return this.filteredProducts.length;
  }
}
