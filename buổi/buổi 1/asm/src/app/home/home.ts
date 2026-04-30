import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Product } from '../../interfaces/product';
import { ProductItem } from '../product-item/product-item';

interface HeroBanner {
  image: string;
  title: string;
  subtitle: string;
  game: string;
  buttonText: string;
  link: string;
  queryParams?: { game?: string };
}

interface GameBanner {
  image: string;
  title: string;
  subtitle: string;
  game: string;
  buttonText: string;
  link: string;
  queryParams?: { game?: string };
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, ProductItem],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  // Game banner images (base64)
  private readonly VALORANT_BANNER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMSEhUTExIWFhUXGBgWGBgXGBUYGhYXFRcXFxcVFxgYHSggGBolGxgXITEhJSkrLi4uGB8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAHYBqgMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAEAAECAwUGB//EAD0QAAEDAgQDBQYFAwMEAwAAAAEAAhEDIQQSMUFRYXEFEyKBoTKRscHR8AYjQlJicuHxFDOSQ6KywhVjgv/EABoBAAMBAQEBAAAAAAAAAAAAAAABAgMEBgX/xAAuEQACAgEEAgADBgcAAAAAAAAAAQIRIQMSMUEEUQVh0RMikaHB8AYUIzJxgeH/2gAMAwEAAhEDEQH/APMrc/d/dK3E+7+6iktzIe3E+7+6cAc/cPqoSraFIuMDqmkJtIupYkgAAEnbRWuqkxJvy25A7/BVtpQcrddyd+XRFMe1guLj7lapPsyk0D4yQ0SAP2t+ZWy3s12KwTXUzNVrj4N3Bg8WUbuggxyK52pWzkl2/pwC2vw5iLtwz7Mq1G5ajSQ+lU0a5p5+z568RPImqRz1VjgA4gw4Eg8YJaY6EKkFdd2452Si6mWS9tQ1Gv3JNntdxkAGdZaJmSVytKnxWc4tM0hK1ZKjT4oqm3dQYrGppCbJkqp6sNhJ0VfeXI+SpiRXUbKFLUd5IevT4KGikx9GdVF7/D8VNgJGkwoVWQQJ5mNkMZZQpwOaOYYaShgrKv8Atk84VrBDBmib/eoVgCZug8/jdOSkiguiCbASeA3VvbrCGUxUZlqC0FoDjTgjWRqhwOqFVbtBEfpRZ2p+v0SmuUVYFmNfAXbXZbhznD0jSYHtWS7X4Gn4nD36Tz59j6VJU1RbBo2VFqP2aBJCnQrFqZBBB8BHjGuo2rDVfZBn4t0FfqKsjI6KLw2nj5ZBTJJM5jJ5xfv4/8Kvo1VCE+CvX1Q9t1XPgwf8+I1CnaMdP6lh+KsyB+z0+o2/Qz6LDVzDJ9C1F0OV62/dCxcEqwU7wZIDvw/BxVNFKHqmBJYAJ0aQPQJD2t13tNn5TRWVWHy6fchVBYaKKr72LVNqQEb/p5m9fL/AE+lFVbNJJT/AD8wCKCfDGvzQFEkkFTCQGQMSbC5v41J7T2cRbgQYnTy/BK/wCJsXVJ8x6FvHyRKSbuqpJT/wCFQA5x1DviOqBKhkSaBIJBBAPDw/BJJUE0Qf/Z';

  private readonly DELTA_FORCE_BANNER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxITEhUSExMVFRUXFxgVFxgYFxoYFRoYFxgXFhkXFRUYHSggGB0lHRcXITEiJSkrLy4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyYtLS0tLS0tLS0tLS0tLS0vLS4tLS0tLS0tLS0tLS0uLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAHABwgMBIgACEQEDEQH/xAAbAAAABwEAAAAAAAAAAAAAAAAAAQIDBAUGB//EAEIQAAIBAgQDBgIHBgUDBQEAAAECEQADBBIhMQVBUQYTImFxgTKRBxRCobHB8CNSYoLR8TNTcpLhFRZDVGNzk9Ik/8QAGwEAAgMBAQEAAAAAAAAAAAAAAAIBAwQFBgf/xAAyEQACAgEDAgIJBAEFAAAAAAAAAQIRAwQSITFBBRMUMlRhcZGhsfCBwdHhIgYVUmLx/9oADAMBAAIRAxEAPwDmPDsE166tpd2Op5KBqzHyABPtT/EeC3bd9bAUs1wqLY/eztlVZMDNm8JHIipHBeJW7AuTbdmcBcyuEKqCCQDlO5AnyAp3iHHVdUyJcW7bu99butdDsrEhiB4BpmAbyIFW27OH5mbz0tv+HTt8+v6VQxiOyeNS33rWYt5S+YXLRBVVzllyucwCgmRNM3+zWLSM1k+J7dpSrI6l7wzW0zIxALLBEnZlOzCZB7W4/wD9Vc021EAEZSAI0EaRTH/cmMIy/WLkShidJtlShHQqUSP9C9BU8nRTgSV7FcQJyjDyREgXbJIBLKCR3mgLI4B2JUjcVFxPZfGW0uO9kBbQBuftbRKZhIDqHzBiNcsT5UMP2lxltBbTE3VUHMAGjXMX33+Ji3qTRyOnEqaP2opoVIBxRRQoUACKEVMwmALDO3hTrpJj90Glpj8n+DbAUTLnUmOh5euvtSuSQyjZGtYS43wox9qTdw7r8SMPVSB86GKxty4fE7kHzhfIajxVZcIW7EK7ba6+HLvMbRvr5aVG8naVNCr58PZuDLMOC3ijRo5DlI19qqsbgXtGGjXYjY+k60yditURqFChNSQGaFFQoAApxULNlUEszBVHMkmAPwFN1t/o44Pnc4pxonht9C0QzewMepPSolLarMus1UdNhlll26e99kbLs5whcLYW0ILfE5/ec7n05DyAqzoTQrE3Z84yZJZJucny+WChQoUCArJ/SFxvubPcIYuXRBjdbezH3+H/AHdK0+KxK20a45hVBZj0A1rivGOItiLz3m0LHQfuqNFX2H3yedWYo27O34HofPzeZJf4x5+L7L9//SEAToASToANSSdgB1rsnZXgwwuHVDGc+O4f4jynoBA9vOsZ9HfBO8unEOPBbMJ0Nzr/ACj7yOldKmmzS7Gv/UGu3SWnh0XL+PZfp+dA6FFNCapPMh0ToCCCAQRBB2IO4NCaOgDjPaXhJwt9rUeA+K2eqHYeo2PpPOqomus9t+C/WbEqJu2pdOpH2k9wPmBXJAa145bkfQfCtb6VgTfrLh/z+v3sVQNFQpzpgoUKOgAqFHNFQAKFClZfKgBNClR+poZaAE0Km8N4VfxBIsWXuRqxUeFY18Tnwr7kUfE8IMI2S9le9Em0GkJI2vMv2ueVT0k8jDaRKTZEtW2Ywqlj0UEn5CjuWGX4lKztmBHymoV/iN193MDYDwqI6KsAfKha4jdXZz5zrPIgzuDzHOl3jeWyVA60YWlWLi3QYAW4Nco+FxzKTs3PLseUaAoFMnYrVAfeipwwfWkEVJAVCjy0VAAoUKFAE0001PMKaagxxGzRCjakigtQRpJpVFQOgqFChQWAqTgMOHbxfCNW9OnvUYDlVi9rKoUerH2kn0ApZOhoqxeRsQ+UbBTlAmAANtJPyGwNHirbQvhAtySCBq2uwhtANtuVK/6glq0VykM8aQdQADmGoMa6aR8W9QbHEWZjIMclVTlHmAKob4tF0Y80x61hJuSR7c/IEdJZYSZIn2hXd7LRE2PPMYHT+6Fq0+6eLh1rzaQ4Frm8pBIlKpVMhzmkakC4N/1X15IetUkz09BqlJ2OKFjMIaZEXY4ZmO/c2SL8HAgtcNiDtBMWU1qYB+ejVpPbMfnUnfseC1tQA7tc3UcWDdCXGyW3se4dgoISmzNP3qi866cfvZSosunViugU0tCTHWfpCkzBZpJexsRqYnm3Y+9aXbOFLavc2zZKZIGznNByng6496zq1J1J7qb4kWcAQ6DGxBg8YJaY6EKkFdd2451Si6mWS9tQ1Gv3JNntdxkAGdZaJmSVytKnxWc4tM0hK1ZKjT4oqm3dQYrGppCbJkqp6sNhJ0VfeXI+SpiRXUbKFLUd5IevT4KGikx9GdVF7/D8VNgJGkwoVWQQJ5mNkMZZQpwOaOYYaShgrKv8Atk84VrBDBmib/eoVgCZug8/jdOSkiguiCbASeA3VvbrCGUxUZlqC0FoDjTgjWRqhwOqFVbtBEfpRZ2p+v0SmuUVYFmNfAXbXZbhznD0jSYHtWS7X4Gn4nD36Tz59j6VJU1RbBo2VFqP2aBJCnQrFqZBBB8BHjGuo2rDVfZBn4t0FfqKsjI6KLw2nj5ZBTJJM5jJ5xfv4/8Kvo1VCE+CvX1Q9t1XPgwf8+I1CnaMdP6lh+KsyB+z0+o2/Qz6LDVzDJ9C1F0OV62/dCxcEqwU7wZIDvw/BxVNFKHqmBJYAJ0aQPQJD2t13tNn5TRWVWHy6fchVBYaKKr72LVNqQEb/p5m9fL/AE+lFVbNJJT/AD8wCKCfDGvzQFEkkFTCQGQMSbC5v41J7T2cRbgQYnTy/BK/wCJsXVJ8x6FvHyRKSbuqpJT/wCFQA5x1DviOqBKhkSaBIJBBAPDw/BJJUE0Qf/Z';

  private readonly CS2_BANNER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUQEBIQFRAVFRAPFhUPDxUVEBUPFRUXFhUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OFRAPFy0dFx0tLSstLSstKy0tLS0tKy0rLTctLSstLSsrKy0tKy0tLSstLS0tKy0rLS0tLS0tLS0rK//AABEIAHQBtAMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAABAgADBQQGB//EAEUQAAIBAwIEAwQFCQUHBQAAAAABAgMEERIhBTFBUQYTYSJxgZEHMkKh0RQjUrHB0tPh8BZVkpOUFRc0cqOk4zVEVGOC/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAeEQEBAQEAAwEBAQEAAAAAAAAAARECEiExA2FxQf/aAAwDAQACEQMRAD8A+UMAWA6uaYBgZAAGCBHhEARpjqCCkMgIqYPLQ6IUV+Wg+Wh0iAKqKJ5JahkgOfSWKI849SRQBhA6KdElGmd1CkBXTtl6ndQtEW0KBr2doRXHb2JpULA77a0NOhaAZdKxOunZGpC19C9W77EGbTtC6Nqd8aY044i36YKWvOcXrKK0rkv1njeIT33PScXqbts8rfzPVzzkeS9bWVcmfVR2XFRb7/zM+rUOPVd+IqmUjzkIcm214cvXSqxnnEc4l20PmfTqlHbPQ+O2tR6ljutvXov2n2ixoTVGmqrbnojlvnnGd/U1/wAJ9ZNzaox7q0PVVqRm3NuRXk69scNSieiurcy69IDInSKZUjQqUznlEI4ZRFaOirHqUtAVtDKAYxHAr8tBVNDBQCaETy0ORgJoRNCGIFJoRNCGIFJoRNCGIFJofLbqAaFJqaaDaENDTSaBiJJjTBoRJgJoQBoUU3NDSBoUUmgBoUU0ABoUKB//Z';

  banners: HeroBanner[] = [];

  currentBannerIndex: number = 0;
  newProducts: Product[] = [];
  featuredProducts: Product[] = [];
  rareProducts: Product[] = [];
  isLoading = true;
  private autoSlideInterval?: ReturnType<typeof setInterval>;

  constructor(private route: ActivatedRoute) {
    this.initializeGameBanners();
  }

  ngOnInit() {
    const products = (this.route.snapshot.data['products'] as Product[] | undefined) ?? [];
    this.initializeProducts(products);
  }

  ngOnDestroy() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  private initializeGameBanners() {
    this.banners = [
      {
        image: this.VALORANT_BANNER,
        title: 'Valorant Skins',
        subtitle: 'Khám phá bộ sưu tập skin Valorant hiếm nhất',
        game: 'Valorant',
        buttonText: 'Xem bộ sưu tập',
        link: '/products',
        queryParams: { game: 'Valorant' },
      },
      {
        image: this.DELTA_FORCE_BANNER,
        title: 'Delta Force Gear',
        subtitle: 'Thiết bị tâm chiến Delta Force độc quyền',
        game: 'Delta Force',
        buttonText: 'Khám phá ngay',
        link: '/products',
        queryParams: { game: 'Delta Force' },
      },
      {
        image: this.CS2_BANNER,
        title: 'CS2 Weapons',
        subtitle: 'Skin vũ khí CS2 huyền thoại',
        game: 'CS2',
        buttonText: 'Xem chi tiết',
        link: '/products',
        queryParams: { game: 'CS2' },
      },
    ];
  }

  private initializeProducts(all: Product[]) {
    this.newProducts = all.filter((product) => product.isNew).slice(0, 6);
    this.featuredProducts = [...all].sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0)).slice(0, 6);
    this.rareProducts = all
      .filter((product) => product.isLimited && (product.stock ?? 0) > 0)
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 6);

    if (this.newProducts.length === 0) {
      this.newProducts = all.slice(0, 6);
    }

    if (this.featuredProducts.length === 0) {
      this.featuredProducts = all.slice(0, 6);
    }

    if (this.rareProducts.length === 0) {
      this.rareProducts = all.slice(0, 6);
    }

    this.currentBannerIndex = 0;
    this.startAutoSlide();
    this.isLoading = false;
  }

  prevBanner() {
    if (this.banners.length === 0) return;
    this.currentBannerIndex =
      this.currentBannerIndex === 0 ? this.banners.length - 1 : this.currentBannerIndex - 1;
  }

  nextBanner() {
    if (this.banners.length === 0) return;
    this.currentBannerIndex =
      this.currentBannerIndex === this.banners.length - 1 ? 0 : this.currentBannerIndex + 1;
  }

  goToBanner(index: number) {
    if (index < 0 || index >= this.banners.length) return;
    this.currentBannerIndex = index;
  }

  startAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }

    if (this.banners.length < 2) {
      return;
    }

    this.autoSlideInterval = setInterval(() => {
      this.nextBanner();
    }, 5000);
  }

  private getProductSlug(productName: string): string {
    return encodeURIComponent(productName.toLowerCase().replace(/\s/g, '-'));
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
  }
}
