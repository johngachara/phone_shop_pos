import { api, listFrom } from '@/lib/api'

export interface StockItem {
  id: number
  product_name: string
  quantity: number
  selling_price: string
  buying_price: string | null
  created_at?: string
  updated_at?: string
}

export interface PaginatedStock {
  count: number
  next: string | null
  previous: string | null
  results: StockItem[]
}

/** Stock list with pagination and search.
 *
 * The endpoint wraps its payload in DRF pagination (`count`, `results`), and
 * supports `page` and `page_size` query params.
 */
export async function fetchStock(
  page = 1,
  pageSize = 12,
  query = '',
): Promise<PaginatedStock> {
  const search = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''
  const resp = await api<PaginatedStock | StockItem[]>(
    `/api/get_shop2_stock?page=${page}&page_size=${pageSize}${search}`,
  )
  if (Array.isArray(resp)) {
    return {
      count: resp.length,
      next: null,
      previous: null,
      results: resp,
    }
  }
  return {
    count: resp.count ?? resp.results?.length ?? 0,
    next: resp.next ?? null,
    previous: resp.previous ?? null,
    results: Array.isArray(resp.results) ? resp.results : listFrom<StockItem>(resp),
  }
}

export function addStock(input: {
  product_name: string
  quantity: number
  selling_price: string
  buying_price?: string | null
}) {
  return api<StockItem>('/api/add_stock2', { method: 'POST', json: input })
}

export function updateStock(id: number, input: Partial<StockItem>) {
  return api<StockItem>(`/api/update_stock2/${id}`, { method: 'PATCH', json: input })
}

export function deleteStock(id: number) {
  return api<void>(`/api/delete_stock2_api/${id}`, { method: 'DELETE' })
}

export function sellStock(id: number, input: {
  product_name: string
  price: string
  quantity: number
  customer_name: string
  /** true records it as paid immediately; false puts it on hold. */
  complete?: boolean
}) {
  return api<{ transaction_id: number }>(`/api/sell2/${id}`, { method: 'POST', json: input })
}

export function fetchCustomers() {
  return api<{ customer_name: string }[]>('/api/customers/')
}
