import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProfile } from "./api";

export default function Profile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await getMyProfile();
        if (!ignore) setData(res);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Failed to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading)
    return (
      <div className="container">
        <div className="card">
          <p>Loading…</p>
        </div>
      </div>
    );
  if (err)
    return (
      <div className="container">
        <div className="card">
          <p>{err}</p>
        </div>
      </div>
    );
  if (!data) return null;

  const u = data.user || {};
  const s = data.stats || {};
  const badges = data.badges || [];

  const initial = (u.displayName || u.username || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="container">
      {/* HERO */}
      <div
        className="card"
        style={{ display: "flex", alignItems: "center", gap: 16 }}
      >
        <div
          className="avatar xl"
          style={{
            backgroundImage: u.avatarUrl ? `url(${u.avatarUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        >
          {!u.avatarUrl && initial}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>{u.displayName || u.username}</h1>
          {u.bio && (
            <div className="muted" style={{ marginTop: 6 }}>
              {u.bio}
            </div>
          )}
        </div>
        <Link to="/my-borrows" className="button secondary">
          My Library
        </Link>
      </div>

      {/* STATS STRIP */}
      <div className="stats-grid">
        <StatCard label="Books read" value={s.booksRead} icon="📚" />
        <StatCard
          label="Hours read"
          value={s.hoursRead?.toFixed?.(1) ?? 0}
          icon="⏱️"
        />
        <StatCard
          label="Avg rating"
          value={s.avgRating?.toFixed?.(1) ?? 0}
          icon="⭐"
        />
        <StatCard
          label="Top genres"
          value={(s.topGenres || []).slice(0, 3).join(", ") || "—"}
          icon="🏷️"
        />
      </div>

      {/* BADGES */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Badges</h3>
        <div className="badges">
          {badges.map((b) => (
            <Badge key={b.id} badge={b} />
          ))}
          {badges.length === 0 && (
            <small className="muted">No badges yet.</small>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card stat">
      <div className="stat-icon">{icon}</div>
      <div className="stat-main">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function Badge({ badge }) {
  const achieved = !!badge.achieved;
  return (
    <div className={`badge-tile ${achieved ? "on" : "off"}`}>
      <div className="bt-title">{badge.title}</div>
      <div className="bt-desc">{badge.description}</div>
      {!achieved && <div className="bt-lock">Locked</div>}
    </div>
  );
}
