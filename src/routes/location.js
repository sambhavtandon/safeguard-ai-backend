'use strict';

const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db');

// POST /api/location/checkin
router.post('/checkin', (req, res) => {
  const { userId, latitude, longitude, safetyStatus } = req.body;

  if (!userId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'userId, latitude, and longitude are required' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const user = db.users.find(u => u.id === parseInt(userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const checkin = {
    id: nextId('locations'),
    userId: parseInt(userId),
    latitude: lat,
    longitude: lng,
    safetyStatus: safetyStatus || 'safe',
    checkedInAt: new Date().toISOString(),
  };

  db.locations.push(checkin);
  res.status(201).json({ message: 'Check-in recorded', checkin });
});

// GET /api/location/history?userId=1
router.get('/history', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query param is required' });

  const history = db.locations
    .filter(l => l.userId === parseInt(userId))
    .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt));

  res.status(200).json({ history, total: history.length });
});

// GET /api/location/latest?userId=1
router.get('/latest', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query param is required' });

  const history = db.locations
    .filter(l => l.userId === parseInt(userId))
    .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt));

  if (history.length === 0) {
    return res.status(404).json({ error: 'No check-ins found for this user' });
  }

  res.status(200).json(history[0]);
});

module.exports = router;
