'use strict';

const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db');
const { registeredUsers } = require('../metrics');

// POST /api/users/register
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const existing = db.users.find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = {
    id: nextId('users'),
    name,
    email,
    password, // NOTE: in production, hash with bcrypt — kept plain for demo simplicity
    phone: phone || null,
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  registeredUsers.set(db.users.length);

  const { password: _, ...safeUser } = user;
  res.status(201).json({ message: 'User registered successfully', user: safeUser });
});

// POST /api/users/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, ...safeUser } = user;
  res.status(200).json({ message: 'Login successful', user: safeUser });
});

// GET /api/users
router.get('/', (req, res) => {
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.status(200).json({ users: safeUsers, total: safeUsers.length });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safeUser } = user;
  res.status(200).json(safeUser);
});

module.exports = router;
