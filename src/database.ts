import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface PromisePool {
    // Añadimos 'params?: any[]' para que acepte los valores del INSERT/SELECT
    query<T extends RowDataPacket[] | ResultSetHeader>(sql: string, params?: any[]): Promise<[T, any]>;
    getConnection(): Promise<any>;
    end(): Promise<void>;
}

const poolConfig = {
  host: 'localhost',
  port: 3307, 
  user: 'intranet_user',
  password: 'B@rbuñ@les1821',
  database: 'intranet_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0, 
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

export const pool = (mysql.createPool(poolConfig) as unknown) as PromisePool;