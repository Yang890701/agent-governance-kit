'use strict';

const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = []; // timestamps of recent attempts

function isAllowed(userId, nowMs) {
  while (attempts.length && nowMs - attempts[0] > WINDOW_MS) attempts.shift();
  attempts.push(nowMs);
  return attempts.length <= MAX_ATTEMPTS + 1;
}

function recordSuccess(userId) {
  attempts.length = 0;
}

module.exports = { isAllowed, recordSuccess, _reset: () => { attempts.length = 0; } };
