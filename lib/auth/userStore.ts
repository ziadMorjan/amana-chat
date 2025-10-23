import { ObjectId } from 'mongodb';
import type { SessionUser, UserRecord } from '../types';
import { getDb } from '../db/mongo';

const USERS_COLLECTION = 'users';

type UserDoc = Omit<UserRecord, 'id'> & { _id: ObjectId };

let indexesEnsured = false;

async function getUsersCollection() {
  const db = await getDb();
  const collection = db.collection<UserDoc>(USERS_COLLECTION);

  if (!indexesEnsured) {
    await collection.createIndex({ email: 1 }, { unique: true });
    indexesEnsured = true;
  }

  return collection;
}

function toUserRecord(doc: UserDoc): UserRecord {
  return {
    id: doc._id.toHexString(),
    email: doc.email,
    name: doc.name,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toSessionUser(doc: UserDoc): SessionUser {
  const { passwordHash, ...rest } = toUserRecord(doc);
  return rest;
}

export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
  const collection = await getUsersCollection();
  const doc = await collection.findOne({ email: email.trim().toLowerCase() });
  return doc ? toUserRecord(doc) : undefined;
}

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  const collection = await getUsersCollection();
  if (!ObjectId.isValid(id)) return undefined;
  const objectId = new ObjectId(id);
  const doc = await collection.findOne({ _id: objectId });
  return doc ? toUserRecord(doc) : undefined;
}

export async function listUsers(): Promise<SessionUser[]> {
  const collection = await getUsersCollection();
  const docs = await collection.find().sort({ createdAt: 1 }).toArray();
  return docs.map(toSessionUser);
}

export async function createUser(params: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const collection = await getUsersCollection();
  const now = new Date().toISOString();
  const doc: UserDoc = {
    _id: new ObjectId(),
    email: params.email.trim().toLowerCase(),
    name: params.name.trim(),
    passwordHash: params.passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(doc);
  return toUserRecord(doc);
}

export async function updateUserTimestamp(id: string) {
  const collection = await getUsersCollection();
  if (!ObjectId.isValid(id)) return;
  const objectId = new ObjectId(id);
  await collection.updateOne({ _id: objectId }, { $set: { updatedAt: new Date().toISOString() } });
}
