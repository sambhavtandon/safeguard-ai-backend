'use strict';

// Simple in-memory store — no external DB needed for CI/CD pipeline
const db = {
  users: [],
  sosAlerts: [],
  contacts: [],
  locations: [],
  _nextId: { users: 1, sosAlerts: 1, contacts: 1, locations: 1 },
};

function nextId(collection) {
  return db._nextId[collection]++;
}

function reset() {
  db.users = [];
  db.sosAlerts = [];
  db.contacts = [];
  db.locations = [];
  db._nextId = { users: 1, sosAlerts: 1, contacts: 1, locations: 1 };
}

module.exports = { db, nextId, reset };
