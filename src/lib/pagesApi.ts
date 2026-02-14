
import axiosInstance from '@/config/axiosConfig'

export interface Translation {
  id: number;
  language: number; 
  label: string;
  font: string;
  family: string;
  weight: string;
  size: string;
}

export interface PageData {
  id: number;
  slug: string;
  url: string;
  active: boolean;
  image: string;
  content_blocks: string | null;
  title_translations: Translation[];
  description_translations: Translation[];
  meta_description_mn?: string;
  meta_description_en?: string;
  created_at: string;
  updated_at: string;
}

export interface PagesApiResponse {
  data: PageData[];
  total?: number;
  page?: number;
  limit?: number;
}


export async function fetchPublishedPages(): Promise<PageData[]> {
  try {
    const response = await axiosInstance.get('/page/', {
      params: {
        active: true 
      }
    });

    if (response && response.status === 200) {
      if (response.data.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching published pages:', error);
    return [];
  }
}


export async function fetchAllPages(): Promise<PageData[]> {
  try {
    const response = await axiosInstance.get('/pages/');

    if (response && response.status === 200) {
      if (response.data.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all pages:', error);
    return [];
  }
}


export async function fetchPageBySlug(slug: string): Promise<PageData | null> {
  try {
    // Try by-url endpoint first (matches page URL field)
    const response = await axiosInstance.get(`/page/by-url/`, {
      params: { url: slug.startsWith('/') ? slug : `/${slug}` }
    });

    if (response && response.status === 200) {
      return response.data;
    }
    
    return null;
  } catch (error: any) {
    // If by-url fails, try fetching all pages and matching
    if (error?.response?.status === 404) {
      try {
        const allPages = await fetchPublishedPages();
        const found = allPages.find((p: PageData) => {
          const pageUrl = (p.url || '').replace(/^\//, '');
          const searchSlug = slug.replace(/^\//, '');
          return pageUrl === searchSlug;
        });
        return found || null;
      } catch { return null; }
    }
    console.error(`Error fetching page ${slug}:`, error);
    return null;
  }
}

export async function fetchPageById(id: number): Promise<PageData | null> {
  try {
    const response = await axiosInstance.get(`/page/${id}/`);

    if (response && response.status === 200) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching page ID ${id}:`, error);
    return null;
  }
}


export async function createPage(page: Partial<PageData>): Promise<PageData | null> {
  try {
    const response = await axiosInstance.post('/pages/', page);

    if (response && response.status === 201) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating page:', error);
    throw error;
  }
}


export async function updatePage(id: number, page: Partial<PageData>): Promise<PageData | null> {
  try {
    const response = await axiosInstance.put(`/pages/${id}`, page);

    if (response && response.status === 200) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error updating page ${id}:`, error);
    throw error;
  }
}

export async function deletePage(id: number): Promise<boolean> {
  try {
    const response = await axiosInstance.delete(`/pages/${id}`);

    return response && response.status === 200;
  } catch (error) {
    console.error(`Error deleting page ${id}:`, error);
    return false;
  }
}

export function getTranslation(translations: Translation[], language: number): Translation {
  return translations.find(t => t.language === language) || translations[0];
}

export function getTitle(page: PageData, language: 'mn' | 'en'): string {
  const langId = language === 'mn' ? 1 : 2;
  const translation = getTranslation(page.title_translations, langId);
  return translation?.label || '';
}

export function getDescription(page: PageData, language: 'mn' | 'en'): string {
  const langId = language === 'mn' ? 1 : 2;
  const translation = getTranslation(page.description_translations, langId);
  return translation?.label || '';
}