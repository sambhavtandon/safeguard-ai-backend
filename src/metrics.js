'use strict';

const express = require('express');
const client = require('prom-client');

const register = new client.Registry();

// Default system metrics (CPU, memory, event loop)
client.collectDefaultMetrics({ register });

// Custom: total HTTP requests
const httpRequestCounter = new client.Counter({
  name: 'safeguard_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Custom: HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'safeguard_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

// Custom: active SOS alerts gauge
const activeSosAlerts = new client.Gauge({
  name: 'safeguard_active_sos_alerts',
  help: 'Number of currently active SOS alerts',
  registers: [register],
});

// Custom: registered users counter
const registeredUsers = new client.Gauge({
  name: 'safeguard_registered_users_total',
  help: 'Total number of registered users',
  registers: [register],
});

const metricsRouter = express.Router();

metricsRouter.get('/', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = {
  metricsRouter,
  httpRequestCounter,
  httpRequestDuration,
  activeSosAlerts,
  registeredUsers,
  register,
};
