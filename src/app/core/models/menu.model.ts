export interface Category {
  id: number;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface CategoryListResponse {
  status: number;
  message?: string;
  data: Category[];
}

export interface ProductCategory {
  id: number;
  name: string;
  icon: string | null;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  rating: number;
  review_count: number;
  delivery_info: string | null;
  delivery_time: string | null;
  is_available: number;
  category?: ProductCategory;
}

export interface ProductListResponse {
  status: number;
  data: Product[];
}

export interface FavoriteRecord {
  id: number;
  user_id: number;
  product_id: number;
  product: Product;
  created_at?: string;
  updated_at?: string;
}

export interface FavoriteListResponse {
  status: number;
  data: FavoriteRecord[];
}

export interface FavoriteMutationResponse {
  message: string;
  data?: FavoriteRecord;
}

export interface ProductQuery {
  category_id?: number;
  sort?: 'popular' | 'price-asc' | 'price-desc' | 'new';
  min_price?: number;
  max_price?: number;
  search?: string;
}