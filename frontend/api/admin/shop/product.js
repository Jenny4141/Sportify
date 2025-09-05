import { adminApiClient } from '@/api/axios'

// 獲取所有商品
export const fetchProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await adminApiClient.get(`/shop/product?${query}`)
  return res.data
}
// 獲取單一商品
export const fetchProduct = async (id) => {
  const res = await adminApiClient.get(`/shop/product/${id}`)
  return res.data
}
// 創建新商品
export const createProduct = async (data) => {
  const res = await adminApiClient.post('/shop/product', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
// 更新商品
export const updateProduct = async (id, data) => {
  const res = await adminApiClient.put(`/shop/product/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
// 刪除商品
export const deleteProduct = async (deletedId) => {
  const res = await adminApiClient.delete(`/shop/product/${deletedId}`)
  return res.data
}
// 獲取所有商品（用於訂單下拉選單）
export const fetchAllProductsOrder = async () => {
  const res = await adminApiClient.get('/shop/product/list')
  return res.data
}
// 刪除商品圖片
export const deleteProductImage = async (imageId) => {
  const res = await adminApiClient.delete(`/shop/product/image/${imageId}`)
  return res.data
}
// 獲取品牌資料
export const fetchBrandData = async () => {
  const res = await adminApiClient.get('/shop/product/brand')
  return res.data
}
// 獲取運動類別資料
export const fetchSportData = async () => {
  const res = await adminApiClient.get('/shop/product/sport')
  return res.data
}
