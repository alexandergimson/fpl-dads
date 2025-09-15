
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// scripts/fetch-fpl.js (CommonJS)
const { writeFile, mkdir } = require('node:fs/promises');
const { join } = require('node:path');

// All IDs used in your App.js
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

  for (const id of ENTRIES) {
    try {
      const json = await fetchEntry(id);
      const file = join(outDir, `entry-${id}.json`);
      await writeFile(file, JSON.stringify(json, null, 2), 'utf8');
      console.log(`✅ wrote ${file}`);
    } catch (err) {
      console.error(`❌ failed ${id}: ${err.message}`);
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
