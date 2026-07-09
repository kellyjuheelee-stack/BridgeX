const express = require('express');
const ctrl = require('../controllers/auth.controller');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', ctrl.login);
router.get('/me', requireAdmin, ctrl.me);

module.exports = router;
