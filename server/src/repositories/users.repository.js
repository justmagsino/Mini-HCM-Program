import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebaseAdmin.js';
import { fetchByIdChunks } from '../utils/firestoreBatch.js';

const COLLECTION = 'users';

/**
 * @param {FirebaseFirestore.DocumentSnapshot} doc
 */
export function mapUserDocToDto(doc) {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  const createdAt = data.createdAt?.toDate?.();

  return {
    uid: doc.id,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    timezone: data.timezone,
    schedule: data.schedule,
    createdAt: createdAt ? createdAt.toISOString() : null,
  };
}

export async function getUserById(uid) {
  const doc = await db.collection(COLLECTION).doc(uid).get();
  return mapUserDocToDto(doc);
}

export async function userExists(uid) {
  const doc = await db.collection(COLLECTION).doc(uid).get();
  return doc.exists;
}

/**
 * @param {string} uid
 * @param {{ fullName: string; email: string; role?: string; timezone: string; schedule: { start: string; end: string } }} data
 */
export async function createUser(uid, data) {
  const ref = db.collection(COLLECTION).doc(uid);

  await ref.set({
    fullName: data.fullName,
    email: data.email,
    role: data.role ?? 'employee',
    timezone: data.timezone,
    schedule: data.schedule,
    createdAt: FieldValue.serverTimestamp(),
  });

  const doc = await ref.get();
  return mapUserDocToDto(doc);
}

/**
 * @param {{ role?: 'employee' | 'admin'; limit?: number }} [options]
 */
export async function listUsers(options = {}) {
  const limit = Math.min(options.limit ?? 500, 500);
  let query = db.collection(COLLECTION);

  if (options.role) {
    query = query.where('role', '==', options.role);
  }

  const snapshot = await query.limit(limit).get();
  const users = snapshot.docs.map((doc) => mapUserDocToDto(doc));
  return users.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/**
 * @param {string[]} uids
 */
export async function getUsersByIds(uids) {
  if (!uids.length) {
    return [];
  }

  return fetchByIdChunks(uids, async (chunk) => {
    const refs = chunk.map((uid) => db.collection(COLLECTION).doc(uid));
    const docs = await db.getAll(...refs);
    return docs.map((doc) => mapUserDocToDto(doc)).filter(Boolean);
  });
}

/**
 * @param {string} uid
 * @param {Partial<{ fullName: string; timezone: string; schedule: { start: string; end: string } }>} updates
 */
export async function updateUser(uid, updates) {
  const ref = db.collection(COLLECTION).doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    return null;
  }

  const payload = {};
  if (updates.fullName !== undefined) {
    payload.fullName = updates.fullName;
  }
  if (updates.timezone !== undefined) {
    payload.timezone = updates.timezone;
  }
  if (updates.schedule !== undefined) {
    payload.schedule = updates.schedule;
  }

  if (Object.keys(payload).length > 0) {
    await ref.update(payload);
  }

  const updated = await ref.get();
  return mapUserDocToDto(updated);
}

/**
 * @param {string} uid
 * @param {'employee' | 'admin'} role
 */
export async function updateUserRole(uid, role) {
  const ref = db.collection(COLLECTION).doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    return null;
  }

  await ref.update({ role });
  const updated = await ref.get();
  return mapUserDocToDto(updated);
}

/**
 * @param {'employee' | 'admin'} role
 */
export async function countByRole(role) {
  const query = db.collection(COLLECTION).where('role', '==', role);
  const snapshot =
    role === 'admin'
      ? await query.limit(2).get()
      : await query.limit(500).get();
  return snapshot.size;
}
