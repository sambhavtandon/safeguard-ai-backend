'use strict';

const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db');

// POST /api/contacts — add trusted contact
router.post('/', (req, res) => {
  const { userId, name, phone, relationship } = req.body;

  if (!userId || !name || !phone) {
    return res.status(400).json({ error: 'userId, name, and phone are required' });
  }

  const user = db.users.find(u => u.id === parseInt(userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const phoneRegex = /^\+?[\d\s\-()]{7,15}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  // Max 5 trusted contacts per user
  const existing = db.contacts.filter(c => c.userId === parseInt(userId));
  if (existing.length >= 5) {
    return res.status(400).json({ error: 'Maximum of 5 trusted contacts allowed' });
  }

  const contact = {
    id: nextId('contacts'),
    userId: parseInt(userId),
    name,
    phone,
    relationship: relationship || 'other',
    addedAt: new Date().toISOString(),
  };

  db.contacts.push(contact);
  res.status(201).json({ message: 'Trusted contact added', contact });
});

// GET /api/contacts?userId=1
router.get('/', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query param is required' });

  const contacts = db.contacts.filter(c => c.userId === parseInt(userId));
  res.status(200).json({ contacts, total: contacts.length });
});

// DELETE /api/contacts/:id
router.delete('/:id', (req, res) => {
  const idx = db.contacts.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Contact not found' });

  const removed = db.contacts.splice(idx, 1);
  res.status(200).json({ message: 'Contact removed', contact: removed[0] });
});

module.exports = router;
