export interface Product {
  _id?: string;
  name: string;
  price: number;
  image: string;
  mainImage?: string;
  subImage?: string;
  game?: string;
  rarity?: string;
  isNew?: boolean;
  isLimited?: boolean;
  releaseDate?: string;
  sales?: number;
  stock?: number;
  description?: string;
  images?: string[];
  category?: string | { _id: string; name: string };
  isActive?: boolean;
}
