import { toast } from "@/hooks/use-toast";
import type { Product } from "@/types/product";
import { api } from '@/lib/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  images?: FileList;
  // Vendor specific fields
  brand?: string;
  manufacturer?: string;
  expiryDate?: string;
  batchNumber?: string;
}

class ProductService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async getProducts(): Promise<Product[]> {
    const response = await api.get('/products/public');
    return response.data.products;
  }

  async getVendorProducts(vendorId: string): Promise<Product[]> {
    const response = await api.get(`/products/vendor/${vendorId}`);
    return response.data;
  }

  async createProduct(productData: ProductFormData) {
    try {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (key === 'images' && value instanceof FileList) {
          Array.from(value).forEach(file => {
            formData.append('images', file);
          });
        } else if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      const response = await api.post('/products', formData);
      const data = response.data;
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      return data.product;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
      throw error;
    }
  }

  async updateProduct(id: string, productData: Partial<ProductFormData>) {
    try {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (key === 'images' && value instanceof FileList) {
          Array.from(value).forEach(file => {
            formData.append('images', file);
          });
        } else if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      const response = await api.put(`/products/${id}`, formData);
      const data = response.data;
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      return data.product;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      });
      throw error;
    }
  }

  async deleteProduct(id: string) {
    try {
      await api.delete(`/products/${id}`);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
      throw error;
    }
  }

  async getFarmerProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/public?sellerType=farmer`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch farmer products');
      }
      
      const data = await response.json();
      return data.products;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch farmer products",
        variant: "destructive",
      });
      return [];
    }
  }
}

export const productService = new ProductService(); 