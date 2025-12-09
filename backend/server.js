import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'data.sqlite');

const app = express();
const port = process.env.PORT || 4000;
const db = new sqlite3.Database(dbFile);

app.use(express.json());

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const ensureSchema = async () => {
  await run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      nickname TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

  await run(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cycle TEXT NOT NULL,
      intro TEXT,
      owner_id INTEGER NOT NULL,
      member_count INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    )`);

  await run(`CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id, user_id),
      FOREIGN KEY(room_id) REFERENCES rooms(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

  await run(`CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      actor_id INTEGER NOT NULL,
      stock_code TEXT NOT NULL,
      stock_name TEXT NOT NULL,
      shares INTEGER NOT NULL,
      action TEXT NOT NULL,
      note TEXT,
      happened_on TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(room_id) REFERENCES rooms(id),
      FOREIGN KEY(actor_id) REFERENCES users(id)
    )`);

  await run(`CREATE TABLE IF NOT EXISTS operation_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(operation_id) REFERENCES operations(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

  const seedUser = await get('SELECT id FROM users LIMIT 1');
  if (!seedUser) {
    await run(`INSERT INTO users (email, password_hash, nickname, avatar_url) VALUES (?, ?, ?, ?)`, [
      'demo@godclub.local',
      'demo-hash',
      '股神小助手',
      'https://api.dicebear.com/7.x/thumbs/svg?seed=godclub-demo'
    ]);
  }

  const demoUser = await get('SELECT id, nickname FROM users LIMIT 1');
  const roomCount = await get('SELECT COUNT(*) as count FROM rooms');

  if (roomCount.count === 0) {
    const { lastID: roomA } = await run(
      `INSERT INTO rooms (name, cycle, intro, owner_id, member_count) VALUES (?, ?, ?, ?, ?)`,
      ['趨勢成長觀察', 'mid', '追蹤中期波段行情', demoUser.id, 1]
    );
    await run(`INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, 'owner')`, [roomA, demoUser.id]);

    const { lastID: roomB } = await run(
      `INSERT INTO rooms (name, cycle, intro, owner_id, member_count) VALUES (?, ?, ?, ?, ?)`,
      ['價值投資筆記', 'value', '長期價值聚焦', demoUser.id, 1]
    );
    await run(`INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, 'owner')`, [roomB, demoUser.id]);
  }
};

const getUserId = (req) => {
  const header = req.header('x-user-id');
  const parsed = parseInt(header, 10);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  return 1;
};

const withRoom = async (roomId) => {
  const room = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
  if (!room) {
    const error = new Error('Room not found');
    error.status = 404;
    throw error;
  }
  return room;
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/rooms', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const excludeOwned = req.query.excludeOwned === 'true' || req.query.excludeOwned === '1';
    const sort = req.query.sort === 'member_desc';
    const rows = await all(
      `SELECT r.*, u.nickname AS owner_nickname
       FROM rooms r
       LEFT JOIN users u ON r.owner_id = u.id
       WHERE (? = 0 OR r.owner_id != ?)
       ORDER BY ${sort ? 'r.member_count DESC' : 'r.id DESC'}`,
      [excludeOwned ? 1 : 0, userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get('/rooms/owned', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const rooms = await all(
      `SELECT r.*, u.nickname AS owner_nickname
       FROM rooms r
       LEFT JOIN users u ON r.owner_id = u.id
       WHERE r.owner_id = ?
       ORDER BY r.id DESC`,
      [userId]
    );
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

app.get('/rooms/joined', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const rows = await all(
      `SELECT r.*, u.nickname AS owner_nickname
       FROM rooms r
       INNER JOIN room_members m ON m.room_id = r.id
       LEFT JOIN users u ON r.owner_id = u.id
       WHERE m.user_id = ? AND m.role = 'member'
       ORDER BY r.member_count DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get('/rooms/:roomId', async (req, res, next) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const room = await withRoom(roomId);
    const operations = await all(
      `SELECT o.*, u.nickname AS actor_nickname
       FROM operations o
       LEFT JOIN users u ON o.actor_id = u.id
       WHERE o.room_id = ?
       ORDER BY o.happened_on DESC, o.id DESC`,
      [roomId]
    );
    const comments = await all(
      `SELECT c.*, u.nickname AS author_nickname
       FROM operation_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.operation_id IN (SELECT id FROM operations WHERE room_id = ?)
       ORDER BY c.created_at ASC`,
      [roomId]
    );
    res.json({ ...room, operations, comments });
  } catch (err) {
    next(err);
  }
});

app.post('/rooms', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { name, cycle, intro } = req.body;
    if (!name || !cycle) {
      res.status(400).json({ error: 'name and cycle are required' });
      return;
    }
    const result = await run(
      `INSERT INTO rooms (name, cycle, intro, owner_id, member_count) VALUES (?, ?, ?, ?, 1)`,
      [name, cycle, intro || '', userId]
    );
    await run(`INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, 'owner')`, [result.lastID, userId]);
    const created = await get(
      `SELECT r.*, u.nickname AS owner_nickname FROM rooms r LEFT JOIN users u ON r.owner_id = u.id WHERE r.id = ?`,
      [result.lastID]
    );
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: room_members.room_id, room_members.user_id')) {
      res.status(409).json({ error: 'already a member' });
      return;
    }
    next(err);
  }
});

app.post('/rooms/:roomId/join', async (req, res, next) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const userId = getUserId(req);
    await withRoom(roomId);
    await run(`INSERT OR IGNORE INTO room_members (room_id, user_id, role) VALUES (?, ?, 'member')`, [roomId, userId]);
    await run(
      `UPDATE rooms SET member_count = (SELECT COUNT(*) FROM room_members WHERE room_id = ?) WHERE id = ?`,
      [roomId, roomId]
    );
    const updated = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    res.json({ message: 'joined', room: updated });
  } catch (err) {
    next(err);
  }
});

app.post('/rooms/:roomId/leave', async (req, res, next) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const userId = getUserId(req);
    await withRoom(roomId);
    await run(`DELETE FROM room_members WHERE room_id = ? AND user_id = ? AND role = 'member'`, [roomId, userId]);
    await run(
      `UPDATE rooms SET member_count = (SELECT COUNT(*) FROM room_members WHERE room_id = ?) WHERE id = ?`,
      [roomId, roomId]
    );
    const updated = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    res.json({ message: 'left', room: updated });
  } catch (err) {
    next(err);
  }
});

app.delete('/rooms/:roomId', async (req, res, next) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const userId = getUserId(req);
    const room = await withRoom(roomId);
    if (room.owner_id !== userId) {
      res.status(403).json({ error: 'only owner can delete room' });
      return;
    }
    await run(`DELETE FROM operation_comments WHERE operation_id IN (SELECT id FROM operations WHERE room_id = ?)`, [roomId]);
    await run(`DELETE FROM operations WHERE room_id = ?`, [roomId]);
    await run(`DELETE FROM room_members WHERE room_id = ?`, [roomId]);
    await run(`DELETE FROM rooms WHERE id = ?`, [roomId]);
    res.json({ message: 'room deleted' });
  } catch (err) {
    next(err);
  }
});

app.post('/rooms/:roomId/operations', async (req, res, next) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const userId = getUserId(req);
    await withRoom(roomId);
    const { stock_code, stock_name, shares, action, note, happened_on } = req.body;
    if (!stock_code || !stock_name || !shares || !action || !happened_on) {
      res.status(400).json({ error: 'missing required fields' });
      return;
    }
    const result = await run(
      `INSERT INTO operations (room_id, actor_id, stock_code, stock_name, shares, action, note, happened_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomId, userId, stock_code, stock_name, shares, action, note || '', happened_on]
    );
    const created = await get('SELECT * FROM operations WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.patch('/operations/:opId', async (req, res, next) => {
  try {
    const opId = parseInt(req.params.opId, 10);
    const existing = await get('SELECT * FROM operations WHERE id = ?', [opId]);
    if (!existing) {
      res.status(404).json({ error: 'operation not found' });
      return;
    }
    const fields = ['stock_code', 'stock_name', 'shares', 'action', 'note', 'happened_on'];
    const updates = [];
    const params = [];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    });
    if (!updates.length) {
      res.json(existing);
      return;
    }
    params.push(opId);
    await run(`UPDATE operations SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
    const updated = await get('SELECT * FROM operations WHERE id = ?', [opId]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete('/operations/:opId', async (req, res, next) => {
  try {
    const opId = parseInt(req.params.opId, 10);
    await run('DELETE FROM operation_comments WHERE operation_id = ?', [opId]);
    const { changes } = await run('DELETE FROM operations WHERE id = ?', [opId]);
    if (changes === 0) {
      res.status(404).json({ error: 'operation not found' });
      return;
    }
    res.json({ message: 'operation deleted' });
  } catch (err) {
    next(err);
  }
});

app.post('/operations/:opId/comments', async (req, res, next) => {
  try {
    const opId = parseInt(req.params.opId, 10);
    const userId = getUserId(req);
    const { content } = req.body;
    const operation = await get('SELECT id FROM operations WHERE id = ?', [opId]);
    if (!operation) {
      res.status(404).json({ error: 'operation not found' });
      return;
    }
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    const result = await run(
      `INSERT INTO operation_comments (operation_id, user_id, content) VALUES (?, ?, ?)`,
      [opId, userId, content]
    );
    const created = await get('SELECT * FROM operation_comments WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'internal error' });
});

app.listen(port, async () => {
  await ensureSchema();
  console.log(`Backend ready on http://localhost:${port}`);
});
