// firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// 檢查是否有必要的配置
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.error('Firebase 配置不完整！請檢查環境變數設定。')
  throw new Error('Firebase 配置不完整')
}

// 檢查配置值的有效性
if (
  firebaseConfig.apiKey === 'your_api_key_here' ||
  firebaseConfig.projectId === 'your_project_id'
) {
  console.error('Firebase 配置包含預設值，請設定正確的環境變數')
  throw new Error('Firebase 配置包含預設值')
}

// 初始化 Firebase 應用
let app
try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  console.error('Firebase 應用初始化失敗:', error)
  throw error
}

// 初始化 Auth
let auth
try {
  auth = getAuth(app)
} catch (error) {
  console.error('Firebase Auth 初始化失敗:', error)
  throw error
}

// 配置 Google Auth Provider
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account',
})

// 添加錯誤處理
auth.onAuthStateChanged(
  (user) => {
    // 靜默處理認證狀態變更
  },
  (error) => {
    console.error('Auth 狀態變更錯誤:', error)
  }
)

export { auth, googleProvider }
