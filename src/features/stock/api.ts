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

/** Stock list.
 *
 * The endpoint wraps its payload in `data`, and paginates when there are many
 * items. Both shapes are accepted so a change in either does not blank the
 * counter screen. */
export async function fetchStock(query = ''): Promise<StockItem[]> {
  // Searching on the server, not in the browser: this endpoint is paginated,
  // so filtering what happens to be loaded reports "not stocked" for anything
  // further down the list. The server also does fuzzy matching, which a
  // client-side `includes` cannot.
  const search = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
  return listFrom<StockItem>(await api<unknown>(`/api/get_shop2_stock${search}`))
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
}) {
  return api<{ transaction_id: number }>(`/api/sell2/${id}`, { method: 'POST', json: input })
}

export function fetchCustomers() {
  return api<{ customer_name: string }[]>('/api/customers/')
}
