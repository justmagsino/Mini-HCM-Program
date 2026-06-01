const TTL_MS = 30_000;
const MAX_ENTRIES = 200;

/** @type {Map<string, { user: object; expiresAt: number }>} */
const cache = new Map();

/**
 * @param {string} uid
 */
export function invalidateUserCache(uid) {
  cache.delete(uid);
}

/**
 * @param {string} uid
 */
function getCachedUser(uid) {
  const entry = cache.get(uid);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(uid);
    return null;
  }
  return entry.user;
}

/**
 * @param {string} uid
 * @param {object} user
 */
function setCachedUser(uid, user) {
  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  cache.set(uid, { user, expiresAt: Date.now() + TTL_MS });
}

export { getCachedUser, setCachedUser };
