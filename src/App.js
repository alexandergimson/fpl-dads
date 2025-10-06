import { useEffect, useMemo, useState } from "react";
import "./App.css";
import newDads from "./assets/newdads.png";
import oldDads from "./assets/olddads.png";
import notDads from "./assets/notdads.png";

/** Teams */
const TEAMS = {
  "New Dads": [5176020, 5141122, 7767007, 7336444],
  "Old Dads": [3283746, 786627, 8550880, 7397174],
  "Not Dads": [6686347, 4807653, 1283058, 1890729],
};

const TEAM_IMAGES = {
  "New Dads": newDads,
  "Old Dads": oldDads,
  "Not Dads": notDads,
};

// Arrays so index aligns with TEAMS ids
const TEAM_PLAYERS = {
  "New Dads": ["Eric", "Alex G", "Lee", "Pete"],
  "Old Dads": ["Kev", "Tom", "Rich W", "Rich B"],
  "Not Dads": ["Alex D", "Nikesh", "Jon", "Ross"],
};

/** Build-time JSON base (works in dev and on GitHub Pages) */
const BASE =
  (process.env.PUBLIC_URL && process.env.PUBLIC_URL.replace(/\/$/, "")) || "";

/** Fetch a cached entry JSON produced at build time */
async function fetchCachedEntry(entryId) {
  const url = `${BASE}/data/entry-${entryId}.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Entry ${entryId} not found in cache (${res.status})`);
  return res.json();
}

export default function App() {
  const [pointsByEntry, setPointsByEntry] = useState({});
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [view, setView] = useState("teams"); // "teams" | "players"

  const allEntryIds = useMemo(() => Object.values(TEAMS).flat(), []);

  async function loadAll() {
    setLoading(true);
    setErrors([]);
    try {
      const next = {};
      const errs = [];

      // Get GW from the first entry and capture its points
      const [firstId, ...restIds] = allEntryIds;

      try {
        const firstData = await fetchCachedEntry(firstId);
        next[firstId] =
          typeof firstData?.summary_overall_points === "number"
            ? firstData.summary_overall_points
            : 0;
        setCurrentEvent(firstData?.current_event ?? null);
      } catch (e) {
        next[firstId] = 0;
        errs.push(`Entry ${firstId}: ${e?.message ?? "Unknown error"}`);
        setCurrentEvent(null);
      }

      // Fetch remaining entries from cached JSON
      const results = await Promise.allSettled(
        restIds.map(async (id) => {
          const data = await fetchCachedEntry(id);
          const pts =
            typeof data?.summary_overall_points === "number"
              ? data.summary_overall_points
              : 0;
          return { id, pts };
        })
      );

      results.forEach((r, i) => {
        const id = restIds[i];
        if (r.status === "fulfilled") next[id] = r.value.pts;
        else {
          next[id] = 0;
          errs.push(`Entry ${id}: ${r.reason?.message ?? "Unknown error"}`);
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

  /** Teams table (sum per team) */
  const teamTable = useMemo(() => {
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

  /** Players leaderboard (each entry, sorted by total points) */
  const playerTable = useMemo(() => {
    const rows = [];
    for (const [teamName, ids] of Object.entries(TEAMS)) {
      ids.forEach((id, idx) => {
        rows.push({
          id,
          player: TEAM_PLAYERS[teamName][idx],
          team: teamName,
          total: pointsByEntry[id] ?? 0,
        });
      });
    }
    rows.sort((a, b) => b.total - a.total);
    // rank with ties
    return rows.map((row, i, arr) => {
      const prev = arr[i - 1];
      const rank = prev && prev.total === row.total ? "-" : i + 1;
      return { ...row, rank };
    });
  }, [pointsByEntry]);

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">
          FPL Dads League{currentEvent ? ` - Gameweek ${currentEvent}` : ""}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button" onClick={loadAll} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <div className="segmented">
            <button
              className={`button ${view === "teams" ? "button--active" : ""}`}
              onClick={() => setView("teams")}
              aria-pressed={view === "teams"}
              title="Show teams table"
            >
              Teams
            </button>
            <button
              className={`button ${view === "players" ? "button--active" : ""}`}
              onClick={() => setView("players")}
              aria-pressed={view === "players"}
              title="Show players leaderboard"
            >
              Players
            </button>
          </div>
        </div>
      </header>

      {view === "teams" ? (
        <section className="table">
          <div className="row row--head">
            <div className="cell cell--pos">Pos</div>
            <div className="cell cell--team">Team</div>
            <div className="cell cell--pts">Total points</div>
          </div>

          {teamTable.map((row) => (
            <div key={row.team} className="row">
              <div className="cell cell--pos pos-number">{row.rank}</div>

              <div className="cell cell--team">
                <img
                  src={TEAM_IMAGES[row.team]}
                  alt={`${row.team} badge`}
                  className="badge"
                  loading="lazy"
                />
                <div className="team-container">
                  <span className="team-name">{row.team}</span>
                  <div className="team-players">
                    {TEAM_PLAYERS[row.team].map((name, idx) => {
                      const entryId = TEAMS[row.team][idx];
                      const href = currentEvent
                        ? `https://fantasy.premierleague.com/entry/${entryId}/event/${currentEvent}`
                        : `https://fantasy.premierleague.com/entry/${entryId}/`;
                      return (
                        <a
                          key={entryId}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginRight: 8 }}
                        >
                          {name},
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="cell cell--pts points-number">{row.total}</div>
            </div>
          ))}
        </section>
      ) : (
        <section className="table">
          <div className="row row--head">
            <div className="cell cell--pos">Pos</div>
            <div className="cell cell--team">Player</div>
            <div className="cell cell--pts">Total points</div>
          </div>

          {playerTable.map((row) => {
            const href = currentEvent
              ? `https://fantasy.premierleague.com/entry/${row.id}/event/${currentEvent}`
              : `https://fantasy.premierleague.com/entry/${row.id}/`;
            return (
              <div key={row.id} className="row">
                <div className="cell cell--pos pos-number">{row.rank}</div>

                <div className="cell cell--team">
           
                  <div className="team-container">
                    <span className="team-name">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${row.player}'s FPL page`}
                      >
                        {row.player}
                      </a>
                    </span>
                    <div className="team-players" style={{ opacity: 0.8 }}>
                      {row.team}
                    </div>
                  </div>
                </div>

                <div className="cell cell--pts points-number">{row.total}</div>
              </div>
            );
          })}
        </section>
      )}

      {errors.length > 0 && (
        <section className="errors">
          <div className="errors__title">Fetch issues</div>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
