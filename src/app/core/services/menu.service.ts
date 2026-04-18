import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CategoryListResponse,
  FavoriteListResponse,
  FavoriteMutationResponse,
  ProductListResponse,
  ProductQuery,
  Product
} from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly categoriesApiUrl = 'http://localhost:3000/api/categories';
  private readonly productsApiUrl = 'http://localhost:3000/api/products';
  private readonly favoritesApiUrl = 'http://localhost:3000/api/favorites';

  getCategories(): Observable<CategoryListResponse> {
    return this.http.get<CategoryListResponse>(this.categoriesApiUrl);
  }

  getProducts(query: ProductQuery): Observable<ProductListResponse> {
    let params = new HttpParams();

    if (query.category_id !== undefined) {
      params = params.set('category_id', String(query.category_id));
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }
    if (query.min_price !== undefined) {
      params = params.set('min_price', String(query.min_price));
    }
    if (query.max_price !== undefined) {
      params = params.set('max_price', String(query.max_price));
    }
    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.http.get<ProductListResponse>(this.productsApiUrl, { params });
  }

  getProductById(id: number | string): Observable<{ success: boolean; data: Product }> {
    return this.http.get<{ success: boolean; data: Product }>(`${this.productsApiUrl}/${id}`);
  }

  getFavorites(): Observable<FavoriteListResponse> {
    return this.http.get<FavoriteListResponse>(this.favoritesApiUrl);
  }

  addFavorite(productId: number): Observable<FavoriteMutationResponse> {
    return this.http.post<FavoriteMutationResponse>(this.favoritesApiUrl, { product_id: productId });
  }

  removeFavorite(productId: number): Observable<FavoriteMutationResponse> {
    return this.http.delete<FavoriteMutationResponse>(`${this.favoritesApiUrl}/${productId}`);
  }
}