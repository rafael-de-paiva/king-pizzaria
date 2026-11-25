export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  available: boolean;
}
