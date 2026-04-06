import { resolve } from 'path';

// Dynamic imports ensure dotenv runs before connection.ts reads DATABASE_URL.
// Static imports are all hoisted and evaluated before any executable code,
// so the only way to guarantee order is dynamic import.
// Look for .env in project root (one level above backend/).
const { config } = await import('dotenv');
config({ path: resolve('..', '.env') });

const { migrate } = await import('drizzle-orm/mysql2/migrator');
const { db } = await import('./connection.js');

console.log('執行資料庫 migration...');

await migrate(db, { migrationsFolder: './src/db/migrations' });

console.log('Migration 完成！');
process.exit(0);
