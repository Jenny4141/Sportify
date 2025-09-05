import axios from 'axios'
import { getAuthHeader } from '@/lib/utils'
import { API_SERVER, API_SERVER_ADMIN } from '@/lib/api-path'

/* const API_SERVER = 'http://localhost:3005/api'
const API_SERVER_ADMIN = 'http://localhost:3005/api/admin' */

// 前台 API
export const apiClient = axios.create({
  baseURL: API_SERVER,
  headers: { 'Content-Type': 'application/json' },
})

// 後台 API
export const adminApiClient = axios.create({
  baseURL: API_SERVER_ADMIN,
  headers: { 'Content-Type': 'application/json' },
})

// JWT 攔截器
;[apiClient, adminApiClient].forEach((client) => {
  client.interceptors.request.use((config) => {
    Object.assign(config.headers, getAuthHeader())
    return config
  })
})
