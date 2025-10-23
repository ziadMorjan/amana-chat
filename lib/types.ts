export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
};

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = Omit<UserRecord, 'passwordHash'>;
