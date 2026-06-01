/**
 * Minimal in-memory Firestore stand-in for API integration tests.
 */

function clone(value) {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value.toDate === 'function') {
    return value;
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (Array.isArray(value)) {
    return value.map(clone);
  }
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
  }
  return value;
}

class MemoryTimestamp {
  /** @param {Date} date */
  constructor(date) {
    this._date = date;
  }

  static fromDate(date) {
    return new MemoryTimestamp(date);
  }

  toDate() {
    return new Date(this._date.getTime());
  }
}

export const FieldValue = {
  serverTimestamp() {
    return { __serverTimestamp: true };
  },
};

export const Timestamp = MemoryTimestamp;

function resolveValue(value) {
  if (value && typeof value === 'object' && value.__serverTimestamp) {
    return new Date();
  }
  if (value instanceof MemoryTimestamp) {
    return value.toDate();
  }
  return clone(value);
}

function makeSnapshot(collection, id, data) {
  const exists = data !== undefined;
  return {
    id,
    exists,
    data: () => (exists ? clone(data) : undefined),
  };
}

class MemoryDocRef {
  /** @param {Map<string, Map<string, object>>} store @param {string} collection @param {string} id */
  constructor(store, collection, id) {
    this._store = store;
    this._collection = collection;
    this._id = id;
  }

  get id() {
    return this._id;
  }

  _bucket() {
    if (!this._store.has(this._collection)) {
      this._store.set(this._collection, new Map());
    }
    return this._store.get(this._collection);
  }

  async get() {
    const data = this._bucket().get(this._id);
    return makeSnapshot(this._collection, this._id, data);
  }

  async set(data) {
    const resolved = {};
    for (const [key, value] of Object.entries(data)) {
      resolved[key] = resolveValue(value);
    }
    this._bucket().set(this._id, resolved);
  }

  async update(data) {
    const existing = this._bucket().get(this._id);
    if (!existing) {
      throw new Error(`Document ${this._collection}/${this._id} not found`);
    }
    const next = { ...existing };
    for (const [key, value] of Object.entries(data)) {
      next[key] = resolveValue(value);
    }
    this._bucket().set(this._id, next);
  }
}

class MemoryQuery {
  /** @param {Map<string, Map<string, object>>} store @param {string} collection @param {Array<{ field: string; op: string; value: unknown }>} filters */
  constructor(store, collection, filters = []) {
    this._store = store;
    this._collection = collection;
    this._filters = filters;
    this._orderBy = null;
    this._limit = Infinity;
  }

  where(field, op, value) {
    return new MemoryQuery(this._store, this._collection, [
      ...this._filters,
      { field, op, value },
    ]);
  }

  orderBy(field, direction = 'asc') {
    const query = new MemoryQuery(this._store, this._collection, this._filters);
    query._orderBy = { field, direction };
    query._limit = this._limit;
    return query;
  }

  limit(n) {
    const query = new MemoryQuery(this._store, this._collection, this._filters);
    query._orderBy = this._orderBy;
    query._limit = n;
    return query;
  }

  _matches(doc) {
    return this._filters.every(({ field, op, value }) => {
      const actual = doc[field];
      if (op === '==') {
        return actual === value;
      }
      if (op === '>=') {
        return actual >= value;
      }
      if (op === '<=') {
        return actual <= value;
      }
      return false;
    });
  }

  async get() {
    const bucket = this._store.get(this._collection) ?? new Map();
    let docs = [...bucket.entries()]
      .filter(([, data]) => this._matches(data))
      .map(([id, data]) => makeSnapshot(this._collection, id, data));

    if (this._orderBy) {
      const { field, direction } = this._orderBy;
      docs.sort((a, b) => {
        const av = a.data()[field];
        const bv = b.data()[field];
        if (av < bv) {
          return direction === 'asc' ? -1 : 1;
        }
        if (av > bv) {
          return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    docs = docs.slice(0, this._limit);

    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
    };
  }
}

class MemoryBatch {
  /** @param {Map<string, Map<string, object>>} store */
  constructor(store) {
    this._store = store;
    this._ops = [];
  }

  set(ref, data) {
    this._ops.push({ type: 'set', ref, data });
    return this;
  }

  update(ref, data) {
    this._ops.push({ type: 'update', ref, data });
    return this;
  }

  async commit() {
    for (const op of this._ops) {
      if (op.type === 'set') {
        await op.ref.set(op.data);
      } else {
        await op.ref.update(op.data);
      }
    }
  }
}

class MemoryCollection {
  /** @param {Map<string, Map<string, object>>} store @param {string} name */
  constructor(store, name) {
    this._store = store;
    this._name = name;
  }

  doc(id) {
    return new MemoryDocRef(this._store, this._name, id);
  }

  where(field, op, value) {
    return new MemoryQuery(this._store, this._name).where(field, op, value);
  }

  limit(n) {
    return new MemoryQuery(this._store, this._name).limit(n);
  }
}

/**
 * @typedef {{ uid: string; email: string; email_verified?: boolean }} TestAuthUser
 */

/**
 * @param {TestAuthUser[]} [users]
 */
export function createMemoryFirestore(users = []) {
  /** @type {Map<string, Map<string, object>>} */
  const store = new Map();
  /** @type {Map<string, TestAuthUser>} */
  const tokens = new Map();

  for (const user of users) {
    tokens.set(`token-${user.uid}`, user);
  }

  const db = {
    collection(name) {
      return new MemoryCollection(store, name);
    },
    batch() {
      return new MemoryBatch(store);
    },
    async getAll(...refs) {
      return Promise.all(refs.map((ref) => ref.get()));
    },
    /** @param {string} collection @param {string} id @param {object} data */
    seed(collection, id, data) {
      const col = new MemoryCollection(store, collection);
      return col.doc(id).set(data);
    },
    clear() {
      store.clear();
    },
  };

  const adminAuth = {
    async verifyIdToken(token) {
      const user = tokens.get(token);
      if (!user) {
        const err = new Error('Invalid token');
        err.code = 'auth/argument-error';
        throw err;
      }
      return {
        uid: user.uid,
        email: user.email,
        email_verified: user.email_verified ?? true,
      };
    },
    /** @param {TestAuthUser} user */
    issueTestToken(user) {
      tokens.set(`token-${user.uid}`, user);
      return `token-${user.uid}`;
    },
  };

  return { db, adminAuth, store };
}
