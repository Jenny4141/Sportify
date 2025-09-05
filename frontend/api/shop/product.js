import { apiClient } from '@/api/axios'

// 取得商品列表 (分頁)
export const getProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await apiClient.get(`/shop/product?${query}`)
  return res.data
}
// 取得單一商品詳細資訊
export const getProductDetail = async (id) => {
  const res = await apiClient.get(`/shop/product/${id}`)
  return res.data
}
// 取得商品列表 (無分頁)
export const getProductsList = async () => {
  const res = await apiClient.get('/shop/product/list')
  return res.data
}
// 取得品牌選項
export const getBrands = async () => {
  const res = await apiClient.get('/shop/product/brands')
  return res.data
}
// 取得運動類型選項
export const getSports = async () => {
  const res = await apiClient.get('/shop/product/sports')
  return res.data
}
