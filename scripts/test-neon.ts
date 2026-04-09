import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 });
  try {
    const res = await sql`SELECT version()`;
    console.log('Connected:', res[0].version);
  } finally {
    await sql.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
