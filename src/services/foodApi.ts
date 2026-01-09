// Food API Service - Open Food Facts Integration

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null;
  salt: number | null;
  servingSize: number;
  source: 'api' | 'custom';
}

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
    'fiber_100g'?: number;
    'salt_100g'?: number;
  };
}

interface OpenFoodFactsResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

/**
 * Search for foods using the Open Food Facts API
 * @param query - Search term
 * @returns Array of FoodItem objects
 */
export async function searchFood(query: string): Promise<FoodItem[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedQuery}&search_simple=1&action=process&json=1&page_size=20`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Open Food Facts API error:', response.status);
      return [];
    }
    
    const data: OpenFoodFactsResponse = await response.json();
    
    // Map and filter products
    const foods: FoodItem[] = data.products
      .filter(product => product.product_name) // Only include products with a name
      .map(product => ({
        id: `off_${product.code}`,
        name: product.product_name || 'Sconosciuto',
        brand: product.brands || null,
        calories: product.nutriments?.['energy-kcal_100g'] ?? null,
        protein: product.nutriments?.['proteins_100g'] ?? null,
        carbs: product.nutriments?.['carbohydrates_100g'] ?? null,
        fats: product.nutriments?.['fat_100g'] ?? null,
        fiber: product.nutriments?.['fiber_100g'] ?? null,
        salt: product.nutriments?.['salt_100g'] ?? null,
        servingSize: 100,
        source: 'api' as const,
      }));
    
    return foods;
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return [];
  }
}
