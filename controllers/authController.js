const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Mock auth - Supabase auth happens on client-side
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  res.json({ message: 'Use Supabase client SDK for registration' });
});

// Login (mock)
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  res.json({ message: 'Use Supabase client SDK for login' });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth service ready. Use Supabase SDK on client-side.' });
});

module.exports = router;