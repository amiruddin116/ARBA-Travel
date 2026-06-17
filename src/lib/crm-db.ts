import mysql from 'mysql2/promise';

if (!process.env.CRM_DATABASE_URL) {
  throw new Error('CRM_DATABASE_URL environment variable is not set');
}

// MySQL connection pool for ARBA Travel CRM (crm.arbatravel.com)
// Requires VPN to be active — only used in scripts/sync-crm.ts and /api/sync/crm
export const crmDb = mysql.createPool(process.env.CRM_DATABASE_URL);
