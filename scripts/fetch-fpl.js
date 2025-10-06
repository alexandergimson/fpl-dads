// scripts/fetch-fpl.js
// Fetches live FPL entry data and writes it to ./public/data/entry-<id>.json
// Works natively on Node 18+ (no node-fetch required)

const { writeFile, mkdir } = require('node:fs/promises');
const { join } = require('node:path');

// ✅ All your FPL entry IDs — update this list if you add or remove teams
const ENTRIES = [
  5176020, 5141122, 7767007, 7336444,
  3283746, 786627, 8550880, 7397174,
  6686347, 4807653, 1283058, 1890729
];

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json,text/plain,*/*',
      'Referer': 'https://fantasy.premierleague.com/',
      'Origin': 'https://fantasy.premierleague.com'
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchEntry(id) {
  const url = `https://fantasy.premierleague.com/api/entry/${id}/`;
  return fetchJson(url);
}

(async function main() {
  const outDir = join(process.cwd(), 'public', 'data');
  await mkdir(outDir, { recursive: true });

  console.log(`Fetching ${ENTRIES.length} FPL entries...\n`);

  for (const id of ENTRIES) {
    try {
      const json = await fetchEntry(id);
      const file = join(outDir, `entry-${id}.json`);
      await writeFile(file, JSON.stringify(json, null, 2), 'utf8');
      console.log(`✅ Wrote ${file} (event ${json.current_event}, total ${json.summary_overall_points})`);
    } catch (err) {
      console.error(`❌ Failed ${id}: ${err.message}`);
    }
  }

  console.log('\nAll entries processed.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
