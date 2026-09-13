import fs from 'fs';
import pg from 'pg';
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/DATABASE_URL=(.*)/)[1].trim();
(async () => {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const cols = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='articles' ORDER BY ordinal_position");
  console.log('article columns: ' + cols.rows.map(r => r.column_name).join(', '));
  const cnt = await c.query('SELECT count(*) FROM articles');
  console.log('total articles: ' + cnt.rows[0].count);
  const src = await c.query('SELECT count(*) FROM sources');
  console.log('total sources: ' + src.rows[0].count);
  await c.end();
})().catch(e => { console.error('DB ERROR: ' + e.message); process.exit(1); });
