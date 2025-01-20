const express = require('express');
const router = express.Router();

const authControllers = require('../controllers/authControllers');

router.post('/api/v1/auth/register', authControllers.register);

router.post('/api/v1/auth/login', authControllers.login);

router.post('/api/v1/auth/forget-password', authControllers.forgetPassword);

router.post('/api/v1/auth/reset-password', authControllers.resetPassword);

module.exports = router;
