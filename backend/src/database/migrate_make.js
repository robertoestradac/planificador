// Quick scaffold for a new versioned migration:
//   npm run migrate:make -- add_some_column_to_users
const fs = require('fs');
const path = require('path');

const name = process.argv.slice(2).join('_').trim();
if (!name) {
  console.error('Usage: npm run migrate:make -- <description_with_underscores>');
  process.exit(1);
}

const safe = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
const now = new Date();
const ts = [
  now.getUTCFullYear(),
  String(now.getUTCMonth() + 1).padStart(2, '0'),
  String(now.getUTCDate()).padStart(2, '0'),
  String(now.getUTCHours()).padStart(2, '0'),
  String(now.getUTCMinutes()).padStart(2, '0'),
].join('');

const filename = `${ts}_${safe}.sql`;
const target = path.join(__dirname, 'migrations', filename);

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `-- ${filename}\n-- Add SQL statements below. Each must end with ';'.\n`);

console.log(`Created ${path.relative(process.cwd(), target)}`);
