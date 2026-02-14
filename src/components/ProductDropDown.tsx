import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

// ---------------- TYPES ----------------
type Translation = {
  language: number; // 1 = EN, 2 = MN
  label: string;
};

type Product = {
  id: number;
};

type ProductType = {
  id: number;
  translations: Translation[];
  products: Product[];
};

type Category = {
  id: number;
  translations: Translation[];
  product_types: ProductType[];
};

export default function ProductDropDown() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const router = useRouter();

  // locale -> language id
  const currentLanguage = router.locale === 'mn' ? 2 : 1;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get<Category[]>('/api/categories'); 
        setCategories(res.data);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="flex gap-2">
      {categories.map((category, index) => (
        <div key={category.id} className="relative">
          <button
            onClick={() =>
              setActiveDropdown(activeDropdown === index ? null : index)
            }
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeDropdown === index
                ? 'bg-gray-100 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
            }`}
          >
            {
              category.translations.find(
                (t) => t.language === currentLanguage
              )?.label || 'No translation'
            }

            <svg
              className={`w-4 h-4 transition-transform ${
                activeDropdown === index ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* DROPDOWN */}
          {activeDropdown === index && (
            <div className="absolute mt-2 w-48 rounded-lg bg-white shadow-lg border">
              {category.product_types.map((type) => (
                <div
                  key={type.id}
                  className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                >
                  {
                    type.translations.find(
                      (t) => t.language === currentLanguage
                    )?.label || 'No translation'
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
