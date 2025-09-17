import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  listBooks,
  listAuthors,
  listFollows,
  followAuthor,
  unfollowAuthor,
} from "./api";

function metricRating(b) {
  return b.averageRating ?? b.avgRating ?? b.rating ?? 0;
}

export default function Author() {
  const { name } = useParams(); // URL author name
  const nav = useNavigate();

  const [author, setAuthor] = useState(null); // {id,name,photoUrl,bio,booksCount}
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("Popular");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);

  // Load the Author record by name (to get photoUrl/bio/normalized name)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await listAuthors(name || "");
        const match =
          res.find(
            (a) =>
              (a.name || "").trim().toLowerCase() ===
              (name || "").trim().toLowerCase()
          ) ||
          res[0] ||
          null;
        if (!ignore) setAuthor(match);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      ignore = true;
    };
  }, [name]);

  // Follow state
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const names = await listFollows();
        const target = (author?.name || name || "").trim().toLowerCase();
        if (!ignore)
          setFollowed(
            names.some((n) => (n || "").trim().toLowerCase() === target)
          );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      ignore = true;
    };
  }, [author, name]);

  // Load author's books (filterable)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listBooks({
          author: author?.name || name,
          q,
          page: 1,
          pageSize: 200,
        });
        if (!ignore) setBooks(res.items ?? []);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [author, name, q]);

  // Stats for hero
  const stats = useMemo(() => {
    const count = books.length;
    const avg = count
      ? books.reduce((s, b) => s + (metricRating(b) || 0), 0) / count
      : 0;
    const years = books.map((b) => b.publishedYear).filter(Boolean);
    const span = years.length
      ? `${Math.min(...years)}–${Math.max(...years)}`
      : "—";
    return { count, avg: +avg.toFixed(1), span };
  }, [books]);

  // Sort grid
  const shown = useMemo(() => {
    const arr = [...books];
    if (tab === "Popular")
      arr.sort((a, b) => metricRating(b) - metricRating(a));
    if (tab === "New")
      arr.sort((a, b) => (b.publishedYear ?? 0) - (a.publishedYear ?? 0));
    if (tab === "A–Z")
      arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return arr;
  }, [books, tab]);

  const displayName = author?.name || name || "Author";
  const initial = (displayName[0] || "?").toUpperCase();

  const toggleFollow = async () => {
    try {
      const key = author?.id || displayName;
      if (followed) await unfollowAuthor(key);
      else await followAuthor(key);
      setFollowed((v) => !v);
    } catch (e) {
      alert(e?.message || "Failed to update follow.");
    }
  };

  return (
    <div className="container">
      {/* HERO */}
      <div className="card author-hero">
        <div className="hero-top">
          <button className="chip" onClick={() => nav(-1)} aria-label="Back">
            ← Back
          </button>
        </div>

        <div className="hero-main">
          <div
            className={"hero-avatar" + (author?.photoUrl ? " photo" : "")}
            style={
              author?.photoUrl
                ? { backgroundImage: `url(${author.photoUrl})` }
                : {}
            }
            aria-hidden
          >
            {!author?.photoUrl && initial}
          </div>

          <div className="hero-meta">
            <h1 className="hero-name">{displayName}</h1>
            <div className="hero-stats">
              <span className="badge">
                📚 {stats.count} book{stats.count === 1 ? "" : "s"}
              </span>
              <span className="badge">⭐ {stats.avg}</span>
              <span className="badge">🗓 {stats.span}</span>
            </div>
          </div>

          <div className="hero-actions">
            <button
              className={"button " + (followed ? "secondary" : "")}
              onClick={toggleFollow}
            >
              {followed ? "Following" : "Follow"}
            </button>
          </div>
        </div>

        <div className="hero-controls">
          <div className="tabs">
            {["Popular", "New", "A–Z"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={"chip " + (tab === t ? "chip-active" : "")}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="hero-search">
            <input
              placeholder={`Search ${displayName}'s books…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card book skeleton">
              <div className="cover" />
              <div className="meta">
                <div className="skeleton-line" style={{ width: "80%" }}></div>
                <div
                  className="skeleton-line"
                  style={{ width: "60%", marginTop: 6 }}
                ></div>
              </div>
            </div>
          ))}

        {!loading && shown.map((b) => <AuthorBookCard key={b.id} book={b} />)}

        {!loading && shown.length === 0 && (
          <div
            className="center"
            style={{ gridColumn: "1 / -1", padding: "36px 0" }}
          >
            <small>No books found.</small>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthorBookCard({ book }) {
  const detailsTo = `/books/${book.id}`;
  return (
    <div className="card book">
      <Link
        to={detailsTo}
        className="cover"
        style={{
          backgroundImage: `url(${book.coverUrl || ""})`,
          display: "block",
        }}
        aria-label={`Open ${book.title}`}
      />
      <div className="meta">
        <Link
          to={detailsTo}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="title" title={book.title}>
            {book.title}
          </div>
        </Link>
        <div className="author">{book.author || "Unknown"}</div>
        <div className="sub">
          ⭐ {(book.averageRating ?? 0).toFixed?.(1) ?? 0} ·{" "}
          {book.publishedYear ?? "—"}
        </div>
      </div>
    </div>
  );
}
