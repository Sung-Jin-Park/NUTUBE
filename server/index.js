const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const { crawlAllBoards, crawlSingleBoard } = require('./crawler');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 1. 크롤링 API 라우트
app.get('/api/boards', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await crawlAllBoards();
    const sliced = data.map(board => ({
      ...board,
      posts: (board.posts || []).slice(0, limit)
    }));
    res.json({ success: true, timestamp: new Date().toISOString(), data: sliced });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/board/:id', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await crawlSingleBoard(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Board not found' });
    const sliced = { ...data, posts: (data.posts || []).slice(0, limit) };
    res.json({ success: true, timestamp: new Date().toISOString(), data: sliced });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Vue 정적 빌드 파일(dist) 서빙
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA 라우팅 Fallback (Express v5 호환)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('====================================================');
  console.log(`[SJ Portal] Server Started!`);
  console.log(`URL: ${url}`);
  console.log('====================================================');

  // 윈도우 환경에서 기본 브라우저 자동 오픈
  if (process.platform === 'win32') {
    exec(`start ${url}`);
  }
});
