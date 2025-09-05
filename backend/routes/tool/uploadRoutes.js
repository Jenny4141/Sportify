import express from "express";
import upload from "../../utils/upload-imgs.js"; // 引入 Multer 設定

const router = express.Router();

// 顯示上傳頁面
router.get("/", (req, res) => {
  res.locals.title = "Upload - " + res.locals.title;
  res.locals.pageName = "try-upload";
  res.render("try-upload");
});

// 單張圖片上傳
router.post("/single", upload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("❌ 沒有選擇檔案！");
  }
  res.json({
    body: req.body,
    file: req.file,
    message: "✅ 上傳成功！",
    filePath: `/public/product-imgs/${req.file.filename}`
  });
});

// 多張圖片上傳
router.post("/multiple", upload.array("photos"), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("❌ 沒有選擇檔案！");
  }
  // 取得所有檔案的名稱
  const filePaths = req.files.map(file => `/public/product-imgs/${file.filename}`);
  res.json({
    body: req.body,
    file: req.files,
    message: "✅ 上傳成功！",
    filePaths
  });
});

export default router;