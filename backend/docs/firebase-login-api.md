# Google Firebase 登入 API 文檔

## 概述

這個 API 允許用戶使用 Google Firebase 進行身份驗證登入。當用戶通過 Firebase 驗證後，系統會自動創建或更新用戶資料，並返回 JWT token。

## API 端點

### POST /api/auth/firebase-login

使用 Firebase ID Token 進行登入驗證。

#### 請求格式

```json
{
  "idToken": "firebase_id_token_here"
}
```

#### 請求參數

| 參數    | 類型   | 必填 | 說明                     |
| ------- | ------ | ---- | ------------------------ |
| idToken | string | 是   | Firebase 提供的 ID Token |

#### 成功回應 (200)

```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "用戶名稱",
    "role": "member",
    "avatar": "https://example.com/avatar.jpg",
    "firebaseUid": "firebase_uid_here",
    "emailVerified": true
  },
  "firebase_user": {
    "uid": "firebase_uid_here",
    "email": "user@example.com",
    "name": "用戶名稱",
    "picture": "https://example.com/avatar.jpg",
    "email_verified": true
  }
}
```

#### 錯誤回應

**400 Bad Request** - 請求格式錯誤

```json
{
  "success": false,
  "bodyData": {},
  "code": 0,
  "issues": [
    {
      "path": ["idToken"],
      "message": "Firebase ID Token 為必填欄位"
    }
  ]
}
```

**401 Unauthorized** - Token 驗證失敗

```json
{
  "success": false,
  "bodyData": {},
  "code": 0,
  "issues": [
    {
      "path": ["idToken"],
      "message": "無效的 Firebase Token"
    }
  ]
}
```

**500 Internal Server Error** - 伺服器錯誤

```json
{
  "success": false,
  "error": "伺服器發生錯誤，請稍後再試"
}
```

## 使用流程

### 1. 前端 Firebase 設定

首先在前端設定 Firebase：

```javascript
// 初始化 Firebase
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  // ... 其他設定
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
```

### 2. 用戶登入

```javascript
// 使用 Google 登入
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // 取得 ID Token
    const idToken = await user.getIdToken()

    // 發送給後端 API
    const response = await fetch('/api/auth/firebase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    })

    const data = await response.json()

    if (data.success) {
      // 儲存 JWT token
      localStorage.setItem('token', data.token)
      // 儲存用戶資訊
      localStorage.setItem('user', JSON.stringify(data.user))
    }
  } catch (error) {
    console.error('登入錯誤:', error)
  }
}
```

### 3. 使用 JWT Token

登入成功後，在後續的 API 請求中使用 JWT token：

```javascript
// 在請求標頭中加入 token
const headers = {
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
}

const response = await fetch('/api/some-protected-endpoint', {
  headers,
})
```

## 資料庫變更

### Member 模型新增欄位

```prisma
model Member {
  // ... 現有欄位
  firebaseUid   String?   @unique @map("firebase_uid") @db.VarChar(128)
  // ... 其他欄位
}
```

### 執行資料庫遷移

```bash
# 生成遷移檔案
npx prisma migrate dev --name add_firebase_uid

# 或直接推送變更（開發環境）
npx prisma db push
```

## 環境變數設定

確保在 `.env` 檔案中設定以下 Firebase 相關變數：

```env
# Firebase 服務帳戶環境變數
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_client_x509_cert_url
FIREBASE_UNIVERSE_DOMAIN=googleapis.com

# JWT 密鑰
JWT_SECRET=your_jwt_secret
```

## 安全注意事項

1. **保護 Firebase 服務帳戶金鑰**：確保 `.env` 檔案不會被提交到版本控管
2. **Token 過期處理**：前端應該處理 token 過期的情況
3. **HTTPS**：生產環境必須使用 HTTPS
4. **CORS 設定**：確保 CORS 設定正確，只允許信任的域名

## 錯誤處理

常見的 Firebase 錯誤代碼：

- `auth/id-token-expired`：Token 已過期
- `auth/id-token-revoked`：Token 已被撤銷
- `auth/invalid-id-token`：無效的 Token

## 測試

可以使用 Postman 或其他 API 測試工具測試：

1. 先從 Firebase 取得有效的 ID Token
2. 發送 POST 請求到 `/api/auth/firebase-login`
3. 檢查回應是否包含有效的 JWT token
