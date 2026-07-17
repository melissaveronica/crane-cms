import { query } from '../db.js';

export async function logActivity(userId, action, entityType, entityId, meta = {}) {
  await query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, meta)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, entityType, entityId, meta]
  );
}
