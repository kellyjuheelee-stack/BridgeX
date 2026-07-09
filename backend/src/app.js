const path = require('path');
const express = require('express');
const cors = require('cors');

const diagnosisRoutes = require('./routes/diagnosis.routes');
const authRoutes = require('./routes/auth.routes');
const memberRoutes = require('./routes/member.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_DIR } = require('./middleware/upload');

const app = express();

// CORS
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()) }));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 업로드된 파일 정적 서빙 (fileUrl 접근용)
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check
app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

// API
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/export-diagnosis', diagnosisRoutes);

// 404 + 에러 핸들러 (반드시 마지막)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
