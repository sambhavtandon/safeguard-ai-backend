'use strict';

const express = require('express');
const router = express.Router();
const { db, nextId } = require('../db');
const { activeSosAlerts } = require('../metrics');

// POST /api/sos — trigger SOS alert
router.post('/', (req, res) => {
  const { userId, latitude, longitude, message } = req.body;

  if (!userId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'userId, latitude, and longitude are required' });
  }

  const user = db.users.find(u => u.id === parseInt(userId));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const alert = {
    id: nextId('sosAlerts'),
    userId: parseInt(userId),
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    message: message || 'Emergency! Please help.',
    status: 'active',
    triggeredAt: new Date().toISOString(),
    resolvedAt: null,
  };

  db.sosAlerts.push(alert);
  activeSosAlerts.set(db.sosAlerts.filter(a => a.status === 'active').length);

  res.status(201).json({ message: 'SOS alert triggered', alert });
});

// GET /api/sos — all alerts
router.get('/', (req, res) => {
  const { userId, status } = req.query;
  let alerts = db.sosAlerts;

  if (userId) alerts = alerts.filter(a => a.userId === parseInt(userId));
  if (status) alerts = alerts.filter(a => a.status === status);

  res.status(200).json({ alerts, total: alerts.length });
});

// GET /api/sos/:id
router.get('/:id', (req, res) => {
  const alert = db.sosAlerts.find(a => a.id === parseInt(req.params.id));
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.status(200).json(alert);
});

// PATCH /api/sos/:id/resolve
router.patch('/:id/resolve', (req, res) => {
  const alert = db.sosAlerts.find(a => a.id === parseInt(req.params.id));
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  if (alert.status === 'resolved') {
    return res.status(400).json({ error: 'Alert already resolved' });
  }

  alert.status = 'resolved';
  alert.resolvedAt = new Date().toISOString();
  activeSosAlerts.set(db.sosAlerts.filter(a => a.status === 'active').length);

  res.status(200).json({ message: 'SOS alert resolved', alert });
});

module.exports = router;
