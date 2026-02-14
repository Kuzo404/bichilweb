// Mock pages data with localStorage sync - In production this would come from a database
export interface PageData {
  id: string;
  slug: string;
  title_mn: string;
  title_en: string;
  content_mn: string;
  content_en: string;
  meta_description_mn?: string;
  meta_description_en?: string;
  image_url?: string; // Feature image for the page
  text_color?: string; // Text color (hex code)
  text_align?: 'left' | 'center' | 'right' | 'justify'; // Text alignment
  font_family?: string; // Font family
  font_size?: 'small' | 'medium' | 'large' | 'extra-large'; // Font size
  background_color?: string; // Background color
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const defaultMockPages: PageData[] = [
  {
    id: '1',
    slug: 'about-us',
    title_mn: 'Бидний тухай',
    title_en: 'About Us',
    content_mn: `Манай компани нь 2020 онд үүсгэн байгуулагдсан бөгөөд санхүүгийн үйлчилгээний салбарт тэргүүлэгч байр суурийг эзэлдэг.

Бид үүнд дэмжлэг үзүүлдэг:
• Зээлийн үйлчилгээ
• Хадгаламжийн бүтээгдэхүүн
• Инвестицийн зөвлөгөө
• Санхүүгийн зөвлөгөө

Манай зорилго бол хэрэглэгчдийнхээ санхүүгийн зорилгод хүрэхэд туслах явдал юм.`,
    content_en: `Our company was established in 2020 and holds a leading position in the financial services sector.

We provide support in:
• Loan services
• Savings products
• Investment advice
• Financial consulting

Our goal is to help our customers achieve their financial objectives.`,
    meta_description_mn: 'Манай компанийн тухай дэлгэрэнгүй мэдээлэл',
    meta_description_en: 'Detailed information about our company',
    image_url: 'https://www.bichilglobus.mn/storage/uploadImages/b0efgylnq5cg0oc2022Dec28.jpg',
    is_published: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z'
  },
  {
    id: '2',
    slug: 'our-mission',
    title_mn: 'Манай эрхэм зорилго',
    title_en: 'Our Mission',
    content_mn: `Бид хэрэглэгчдийнхээ амьдралыг сайжруулахад чиглэсэн санхүүгийн шийдлүүд санал болгодог.

Манай үнэт зүйлс:
 Үйлчлүүлэгчийн аюулгүй байдал
 Итгэлцэл ба ил тод байдал  
 Инновац ба технологи
 Тогтвортой хөгжил

Бид ирээдүйн санхүүгийн шийдлийг өнөөдөр хэрэглэгчдэдээ хүргэх зорилготой.`,
    content_en: `We offer financial solutions aimed at improving the lives of our customers.

Our core values:
 Customer security
 Trust and transparency  
 Innovation and technology
 Sustainable development

We aim to bring future financial solutions to our customers today.`,
    meta_description_mn: 'Манай эрхэм зорилго болон үнэт зүйлс',
    meta_description_en: 'Our mission and core values',
    image_url: 'https://www.bichilglobus.mn/storage/uploadImages/b0efgylnq5cg0oc2022Dec28.jpg',
    is_published: true,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T11:45:00Z'
  },
  {
    id: '3',
    slug: 'contact',
    title_mn: 'Холбоо барих',
    title_en: 'Contact Us',
    content_mn: `Бидэнтэй холбогдох боломжит аргууд:

 Хаяг: Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо
 Утас: +976 1234 5678
 И-мэйл: info@company.mn
 Вэб: www.company.mn

Ажлын цаг:
Даваа - Баасан: 09:00 - 18:00
Бямба: 09:00 - 14:00
Ням: Амрах өдөр

Бидэнд хандаж байгаад баярлалаа!`,
    content_en: `Ways to contact us:

 Address: Ulaanbaatar, Sukhbaatar district, 1st khoroo
 Phone: +976 1234 5678
 Email: info@company.mn
 Web: www.company.mn

Working hours:
Monday - Friday: 09:00 - 18:00
Saturday: 09:00 - 14:00
Sunday: Rest day

Thank you for contacting us!`,
    meta_description_mn: 'Бидэнтэй холбогдох мэдээлэл',
    meta_description_en: 'Contact information',
    is_published: true,
    created_at: '2024-01-12T14:00:00Z',
    updated_at: '2024-01-22T16:20:00Z'
  },
  {
    id: '4',
    slug: 'privacy-policy',
    title_mn: 'Нууцлалын бодлого',
    title_en: 'Privacy Policy',
    content_mn: `Энэхүү нууцлалын бодлого нь таны хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалж байгааг тайлбарладаг.

Мэдээлэл цуглуулах:
• Нэр, хаяг, утасны дугаар
• И-мэйл хаяг
• Санхүүгийн мэдээлэл (шаардлагатай тохиолдолд)

Мэдээлэл ашиглах зорилго:
• Үйлчилгээ үзүүлэх
• Харилцаа холбоо хийх
• Аюулгүй байдлыг хангах

Таны мэдээлэл найдвартай хадгалагдана.`,
    content_en: `This privacy policy explains how we collect, use and protect your personal information.

Information Collection:
• Name, address, phone number
• Email address
• Financial information (when necessary)

Purpose of Information Use:
• Providing services
• Communication
• Ensuring security

Your information is stored securely.`,
    meta_description_mn: 'Нууцлалын бодлого болон хувийн мэдээллийн хамгаалалт',
    meta_description_en: 'Privacy policy and personal data protection',
    is_published: true,
    created_at: '2024-01-08T12:00:00Z',
    updated_at: '2024-01-25T10:15:00Z'
  },
  {
    id: '5',
    slug: 'terms-of-service',
    title_mn: 'Үйлчилгээний нөхцөл',
    title_en: 'Terms of Service',
    content_mn: `Энэхүү үйлчилгээний нөхцөлд манай платформыг ашиглахтай холбоотой дүрэм журмууд байна.

Ерөнхий нөхцөлүүд:
1. Бүртгэлийн мэдээлэл үнэн байх
2. Нууц үг аюулгүй хадгалах
3. Хууль бус үйл ажиллагаа явуулахгүй байх

Үүрэг хариуцлага:
• Үйлчлүүлэгчийн үүрэг
• Компанийн үүрэг
• Маргааныг шийдвэрлэх арга зам

Нөхцөлийг зөрчсөн тохиолдолд данс хаагдаж болно.`,
    content_en: `These terms of service contain rules related to using our platform.

General Conditions:
1. Registration information must be accurate
2. Keep passwords secure
3. Do not engage in illegal activities

Responsibilities:
• Customer responsibilities
• Company responsibilities
• Dispute resolution methods

Accounts may be closed if terms are violated.`,
    meta_description_mn: 'Үйлчилгээний нөхцөл болон дүрэм журам',
    meta_description_en: 'Terms of service and regulations',
    is_published: true,
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-28T14:30:00Z'
  },
  {
    id: '6',
    slug: 'draft-example',
    title_mn: 'Ноорог хуудас',
    title_en: 'Draft Page',
    content_mn: 'Энэ бол ноорог хуудас - хараахан нийтлээгүй.',
    content_en: 'This is a draft page - not yet published.',
    is_published: false, // This won't show on frontend
    created_at: '2024-01-30T10:00:00Z',
    updated_at: '2024-01-30T10:00:00Z'
  }
];

// Function to get pages (with localStorage sync)
function getStoredPages(): PageData[] {
  if (typeof window === 'undefined') return defaultMockPages;
  
  try {
    const stored = localStorage.getItem('cms_pages');
    return stored ? JSON.parse(stored) : defaultMockPages;
  } catch {
    return defaultMockPages;
  }
}

// Function to save pages to localStorage
function savePages(pages: PageData[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('cms_pages', JSON.stringify(pages));
  } catch (error) {
    console.warn('Failed to save pages to localStorage:', error);
  }
}

// Initialize default data if not exists
function initializePages(): void {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem('cms_pages');
  if (!stored) {
    savePages(defaultMockPages);
  }
}

// Initialize on first load
if (typeof window !== 'undefined') {
  initializePages();
}

// Function to get published pages only
export function getPublishedPages(): PageData[] {
  return getStoredPages().filter(page => page.is_published);
}

// Function to get page by slug
export function getPageBySlug(slug: string): PageData | undefined {
  return getStoredPages().find(page => page.slug === slug && page.is_published);
}

// Function to get all pages (for admin)
export function getAllPages(): PageData[] {
  return getStoredPages();
}

// Function to add/update page (for admin)
export function savePage(page: PageData): void {
  const pages = getStoredPages();
  const existingIndex = pages.findIndex(p => p.id === page.id);
  
  if (existingIndex >= 0) {
    pages[existingIndex] = page;
  } else {
    pages.push(page);
  }
  
  savePages(pages);
}

// Function to delete page (for admin)
export function deletePage(id: string): boolean {
  const pages = getStoredPages();
  const filteredPages = pages.filter(p => p.id !== id);
  
  if (filteredPages.length < pages.length) {
    savePages(filteredPages);
    return true;
  }
  
  return false;
}
