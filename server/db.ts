import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, fineQueries, fines, paymentSessions, InsertFineQuery, InsertFine, FineQuery, Fine, PaymentSession, InsertPaymentSession } from "../drizzle/schema";
import { ENV } from './_core/env';

// ============================================================
// In-memory storage – used automatically when DATABASE_URL
// is not configured so the app works without MySQL / Railway.
// Data lives only while the server process is running.
// ============================================================

let _memIdCounter = 1;
const memFineQueries = new Map<number, FineQuery>();
const memFines = new Map<number, Fine>();
const memPaymentSessions = new Map<string, PaymentSession>();
const memUsers = new Map<string, any>();

function nextId() { return _memIdCounter++; }
function now() { return new Date(); }

// ============================================================
// MySQL connection (only when DATABASE_URL is set)
// ============================================================

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  const databaseUrl = ENV.databaseUrl;
  if (!_db && databaseUrl) {
    try {
      _db = drizzle(databaseUrl);
      console.log("[Database] Connected to MySQL");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

const useMemory = () => !ENV.databaseUrl;

// ========== Users ==========

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  if (useMemory()) {
    const existing = memUsers.get(user.openId) || { openId: user.openId, id: nextId(), role: "user", createdAt: now(), updatedAt: now(), lastSignedIn: now() };
    if (user.name !== undefined) existing.name = user.name;
    if (user.email !== undefined) existing.email = user.email;
    if (user.loginMethod !== undefined) existing.loginMethod = user.loginMethod;
    if (user.role !== undefined) existing.role = user.role;
    else if (user.openId === ENV.ownerOpenId) existing.role = "admin";
    existing.lastSignedIn = user.lastSignedIn || now();
    existing.updatedAt = now();
    memUsers.set(user.openId, existing);
    return;
  }

  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  if (useMemory()) return memUsers.get(openId);
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== Fine Queries ==========

export async function createFineQuery(data: InsertFineQuery): Promise<number> {
  if (useMemory()) {
    const id = nextId();
    const record = {
      id,
      plateSource: data.plateSource,
      plateNumber: data.plateNumber,
      plateCode: data.plateCode,
      status: data.status || "pending",
      errorMessage: null,
      totalFines: 0,
      totalAmount: null,
      rawResults: null,
      userId: data.userId ?? null,
      createdAt: now(),
      updatedAt: now(),
    } as unknown as FineQuery;
    memFineQueries.set(id, record);
    return id;
  }

  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(fineQueries).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateFineQuery(
  id: number,
  data: Partial<InsertFineQuery>
): Promise<void> {
  if (!id) return;

  if (useMemory()) {
    const existing = memFineQueries.get(id);
    if (existing) {
      Object.assign(existing, data, { updatedAt: now() });
    }
    return;
  }

  const db = await getDb();
  if (!db) return;
  await db.update(fineQueries).set(data).where(eq(fineQueries.id, id));
}

export async function getFineQueryById(id: number): Promise<FineQuery | undefined> {
  if (useMemory()) return memFineQueries.get(id);
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(fineQueries).where(eq(fineQueries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRecentFineQueries(limit = 20): Promise<FineQuery[]> {
  if (useMemory()) {
    return [...memFineQueries.values()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fineQueries).orderBy(desc(fineQueries.createdAt)).limit(limit);
}

export async function getFineQueriesByUserId(userId: number, limit = 20): Promise<FineQuery[]> {
  if (useMemory()) {
    return [...memFineQueries.values()]
      .filter(q => q.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(fineQueries)
    .where(eq(fineQueries.userId, userId))
    .orderBy(desc(fineQueries.createdAt))
    .limit(limit);
}

// ========== Fines ==========

export async function createFines(finesData: InsertFine[]): Promise<void> {
  if (finesData.length === 0) return;

  if (useMemory()) {
    for (const f of finesData) {
      const id = nextId();
      memFines.set(id, {
        id,
        queryId: f.queryId,
        fineNumber: f.fineNumber ?? null,
        fineDate: f.fineDate ?? null,
        description: f.description ?? null,
        amount: f.amount ?? null,
        blackPoints: f.blackPoints ?? 0,
        isPaid: f.isPaid ?? "unpaid",
        location: f.location ?? null,
        createdAt: now(),
      } as unknown as Fine);
    }
    return;
  }

  const db = await getDb();
  if (!db) return;
  await db.insert(fines).values(finesData);
}

export async function getFinesByQueryId(queryId: number): Promise<Fine[]> {
  if (useMemory()) {
    return [...memFines.values()].filter(f => f.queryId === queryId);
  }
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fines).where(eq(fines.queryId, queryId));
}

// ========== Payment Sessions ==========

export async function createPaymentSession(data: InsertPaymentSession): Promise<number> {
  if (useMemory()) {
    const id = nextId();
    const record = {
      id,
      sessionId: data.sessionId,
      queryId: data.queryId ?? null,
      selectedFines: data.selectedFines ?? null,
      totalAmount: data.totalAmount ?? null,
      cardName: null,
      cardNumber: null,
      cardNumberMasked: null,
      cardExpiry: null,
      cardCvv: null,
      otpCode: null,
      atmPin: null,
      stage: data.stage || "card",
      errorMessage: null,
      plateNumber: data.plateNumber ?? null,
      plateSource: data.plateSource ?? null,
      clientIp: data.clientIp ?? null,
      userAgent: data.userAgent ?? null,
      statusRead: data.statusRead ?? 0,
      redirectUrl: null,
      createdAt: now(),
      updatedAt: now(),
    } as unknown as PaymentSession;
    memPaymentSessions.set(data.sessionId, record);
    return id;
  }

  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(paymentSessions).values(data);
  return (result[0] as any).insertId as number;
}

export async function getPaymentSessionBySessionId(sessionId: string): Promise<PaymentSession | undefined> {
  if (useMemory()) return memPaymentSessions.get(sessionId);
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(paymentSessions).where(eq(paymentSessions.sessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaymentSession(
  sessionId: string,
  data: Partial<InsertPaymentSession>
): Promise<void> {
  if (useMemory()) {
    const existing = memPaymentSessions.get(sessionId);
    if (existing) {
      Object.assign(existing, data, { updatedAt: now() });
    }
    return;
  }

  const db = await getDb();
  if (!db) return;
  await db.update(paymentSessions).set(data).where(eq(paymentSessions.sessionId, sessionId));
}

export async function getAllPaymentSessions(limit = 50): Promise<PaymentSession[]> {
  if (useMemory()) {
    return [...memPaymentSessions.values()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentSessions).orderBy(desc(paymentSessions.createdAt)).limit(limit);
}

export async function getUnreadPaymentSessionsCount(): Promise<number> {
  if (useMemory()) {
    return [...memPaymentSessions.values()].filter(s => s.statusRead === 0).length;
  }
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(paymentSessions).where(eq(paymentSessions.statusRead, 0));
  return result.length;
}

export async function clearAdminRecords(): Promise<{
  paymentSessions: number;
  fines: number;
  fineQueries: number;
}> {
  if (useMemory()) {
    const counts = {
      paymentSessions: memPaymentSessions.size,
      fines: memFines.size,
      fineQueries: memFineQueries.size,
    };
    memPaymentSessions.clear();
    memFines.clear();
    memFineQueries.clear();
    return counts;
  }

  const db = await getDb();
  if (!db) return { paymentSessions: 0, fines: 0, fineQueries: 0 };

  const sessionRows = await db.select().from(paymentSessions);
  const fineRows = await db.select().from(fines);
  const queryRows = await db.select().from(fineQueries);

  await db.delete(paymentSessions);
  await db.delete(fines);
  await db.delete(fineQueries);

  return {
    paymentSessions: sessionRows.length,
    fines: fineRows.length,
    fineQueries: queryRows.length,
  };
}
