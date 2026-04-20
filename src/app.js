'use strict';

const express = require('express');
const app = express();

app.use(express.json());

// Routes
const usersRouter = require('./routes/users');
const sosRouter = require('./routes/sos');
const contactsRouter = require('./routes/contacts');
const locationRouter = require('./routes/location');
const { metricsRouter, httpRequestCounter, httpRequestDuration } = require('./metrics');

// Prometheus middleware — track every request
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
    end({ method: req.method, route: req.route ? req.route.path : req.path, status_code: res.statusCode });
  });
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', app: 'SafeGuard+', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use('/api/sos', sosRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/location', locationRouter);
app.use('/metrics', metricsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
