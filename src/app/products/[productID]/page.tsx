import { notFound } from 'next/navigation'
import ProductContent, { type ApiProductResponse } from './ProductContent'

const API_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1'

async function getProduct(id: string): Promise<ApiProductResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/product/${id}/`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error('Failed to fetch product:', err)
    return null
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productID: string }>
}) {
  const { productID } = await params

  if (!productID) notFound()

  const apiData = await getProduct(productID)

  if (!apiData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4">&#x26A0;&#xFE0F;</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Алдаа гарлаа</h2>
          <p className="text-gray-600">Бүтээгдэхүүн олдсонгүй / Product not found</p>
        </div>
      </div>
    )
  }

  return <ProductContent apiData={apiData} />
}