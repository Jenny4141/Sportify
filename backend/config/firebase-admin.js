// config/firebase-admin.js
import admin from 'firebase-admin'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

// 列出需要的 env 名稱（若用 env 方式提供服務帳戶）
const requiredEnvVars = [
  'FIREBASE_TYPE',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
]

// 優先使用 GOOGLE_APPLICATION_CREDENTIALS 指向的 JSON 檔案
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const json = JSON.parse(fs.readFileSync(credPath, 'utf8'))
    admin.initializeApp({
      credential: admin.credential.cert(json),
    })
    console.log(
      '✅ Firebase Admin 初始化成功（使用 GOOGLE_APPLICATION_CREDENTIALS）'
    )
  } catch (error) {
    console.error(
      '❌ 使用 GOOGLE_APPLICATION_CREDENTIALS 初始化 Firebase 失敗:',
      error
    )
    throw error
  }
} else {
  // 檢查 env 變數是否齊全
  const missingVars = requiredEnvVars.filter((v) => !process.env[v])

  if (missingVars.length === 0) {
    // 使用環境變數建立 serviceAccount
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri:
        process.env.FIREBASE_AUTH_URI ||
        'https://accounts.google.com/o/oauth2/auth',
      token_uri:
        process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url:
        process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
        'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
      console.log('✅ Firebase Admin 初始化成功（使用環境變數）')
    } catch (error) {
      console.error('❌ Firebase Admin 初始化失敗:', error)
      throw error
    }
  } else {
    // 開發或測試環境：不阻止應用啟動，只記錄警告
    console.warn(
      `⚠️ Firebase 環境變數不完整：${missingVars.join(
        ', '
      )}。Firebase 初始化已跳過。若需要 Firebase 功能請設定環境變數或 GOOGLE_APPLICATION_CREDENTIALS。`
    )
  }
}

export default admin
