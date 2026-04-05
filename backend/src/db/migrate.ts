import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from './connection.js';
import 'dotenv/config';

console.log('執行資料庫 migration...');

await migrate(db, { migrationsFolder: './src/db/migrations' });

console.log('Migration 完成！');
process.exit(0);
