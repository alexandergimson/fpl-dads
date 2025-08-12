import { useEffect, useMemo, useState } from "react";
import "./App.css";

// ---- 1) Your teams: put the 12 entry IDs here (4 per team)
const TEAMS = {
  "New Dads": [5141122, 1234567, 2345678, 3456789],
  "Old Dads": [4567890, 5678901, 6789012, 7890123],
  "Not Dads": [8901234, 9012345, 1122334, 2233445],
};

// ---- 2) Team badges (use /public/images/* or change to imports)
const TEAM_IMAGES = {
  "New Dads": "/images/new_dads.png",
  "Old Dads": "/images/old_dads.png",
  "Not Dads": "/images/non_dads.png",
};

async function fetchEntryPoints(entryId) {
  const res = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/`);
  if (!res.ok) throw new Error(`Entry ${entryId} fetch failed (${res.status})`);
  const data = await res.json();
  const pts = data?.summary_overall_points;
  return typeof pts === "number" ? pts : 0; // treat null as 0
}

export default function App() {
  const [pointsByEntry, setPointsByEntry] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const allEntryIds = useMemo(() => Object.values(TEAMS).flat(), []);

  async function loadAll() {
    setLoading(true);
    setErrors([]);
    try {
      const results = await Promise.allSettled(allEntryIds.map((id) => fetchEntryPoints(id)));
      const next = {};
      const errs = [];
      results.forEach((res, i) => {
        const id = allEntryIds[i];
        if (res.status === "fulfilled") next[id] = res.value;
        else {
          next[id] = 0;
          errs.push(`Entry ${id}: ${res.reason?.message ?? "Unknown error"}`);
        }
      });
      setPointsByEntry(next);
      setErrors(errs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build league table
  const table = useMemo(() => {
    const rows = Object.entries(TEAMS).map(([team, ids]) => {
      const total = ids.reduce((sum, id) => sum + (pointsByEntry[id] ?? 0), 0);
      return { team, total };
    });
    rows.sort((a, b) => b.total - a.total);
    return rows.map((row, i, arr) => {
      const prev = arr[i - 1];
      const rank = prev && prev.total === row.total ? "-" : i + 1;
      return { ...row, rank };
    });
  }, [pointsByEntry]);

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">FPL Dads League</h1>
        <button className="button" onClick={loadAll} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <section className="table">
  <div className="row row--head">
    <div className="cell cell--pos">Pos</div>
    <div className="cell cell--team">Team</div>
    <div className="cell cell--pts">Total points</div>
  </div>

  {table.map((row) => (
    <div key={row.team} className="row">
      <div className="cell cell--pos">{row.rank}</div>
      
      {/* Team cell now contains badge + name */}
      <div className="cell cell--team">
        <img
          src={TEAM_IMAGES[row.team]}
          alt={`${row.team} badge`}
          className="badge"
          loading="lazy"
        />
        <span className="team-name">{row.team}</span>
      </div>

      <div className="cell cell--pts">{row.total}</div>
    </div>
  ))}
</section>

    </div>
  );
}
