import express from 'express';

const router = express.Router();

// 7-11 選完門市會 POST 到這裡
router.post('/', (req, res) => {
  res.send(`
    <script>
      window.opener.postMessage(${JSON.stringify(req.body)}, "*");
      window.close();
    </script>
  `);
});

export default router;
