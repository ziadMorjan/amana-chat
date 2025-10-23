import { ObjectId } from 'mongodb';
import { getDb } from '../db/mongo';
import type { StoredMessage } from '../types';

const MESSAGES_COLLECTION = 'messages';

type MessageDoc = {
  _id: ObjectId;
  userId: string;
  username: string;
  text: string;
  createdAt: Date;
};

let messageIndexesEnsured = false;

async function getMessagesCollection() {
  const db = await getDb();
  const collection = db.collection<MessageDoc>(MESSAGES_COLLECTION);

  if (!messageIndexesEnsured) {
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ userId: 1, createdAt: -1 });
    messageIndexesEnsured = true;
  }

  return collection;
}

function toStoredMessage(doc: MessageDoc): StoredMessage {
  return {
    id: doc._id.toHexString(),
    userId: doc.userId,
    username: doc.username,
    text: doc.text,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function saveChatMessage(params: {
  userId: string;
  username: string;
  text: string;
}): Promise<StoredMessage> {
  const collection = await getMessagesCollection();
  const doc: MessageDoc = {
    _id: new ObjectId(),
    userId: params.userId,
    username: params.username,
    text: params.text,
    createdAt: new Date(),
  };

  await collection.insertOne(doc);
  return toStoredMessage(doc);
}

export async function fetchRecentMessages(limit = 50): Promise<StoredMessage[]> {
  const collection = await getMessagesCollection();
  const docs = await collection
    .find({})
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 200)))
    .toArray();

  return docs.reverse().map(toStoredMessage);
}
