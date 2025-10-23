import { MongoClient, MongoClientOptions, Db } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB;

if (!mongoUri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

if (!mongoDbName) {
  throw new Error('Missing MONGODB_DB environment variable');
}

const uri = mongoUri;
const dbName = mongoDbName;

type GlobalMongo = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

const globalMongo = globalThis as unknown as { _mongo?: GlobalMongo };

if (!globalMongo._mongo) {
  globalMongo._mongo = { client: null, promise: null };
}

export async function getMongoClient(options?: MongoClientOptions) {
  const cached = globalMongo._mongo!;
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri, options);
  }

  cached.client = await cached.promise;
  return cached.client;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}
