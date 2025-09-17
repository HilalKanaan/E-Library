import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listBooks } from "./api";
import { listAuthors, followAuthor, unfollowAuthor, listFollows } from "./api";

function metricRating(b) {
  return b.averageRating ?? b.avgRating ?? b.rating ?? 0;
}
function borrowedApprox(b) {
  return Math.max(0, (b.totalCopies ?? 0) - (b.availableCopies ?? 0));
}

export default function Home() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("Popular");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: authors + follows for the right rail
  const [trendingAuthors, setTrendingAuthors] = useState([]);
  const [following, setFollowing] = useState([]);

  // Load books (center feed)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listBooks({ page: 1, pageSize: 100, q });
        if (!ignore) setBooks(res.items ?? []);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [q]);

  // NEW: Load authors + current follows (right rail)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [authors, follows] = await Promise.all([
          listAuthors(""), // { id, name, photoUrl, booksCount }
          listFollows(), // array of followed author names
        ]);
        if (!ignore) {
          setTrendingAuthors(authors || []);
          setFollowing(
            (follows || []).map((n) => (n || "").trim().toLowerCase())
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const shown = useMemo(() => {
    const arr = [...books];
    if (tab === "Popular")
      arr.sort((a, b) => metricRating(b) - metricRating(a));
    if (tab === "Top")
      arr.sort((a, b) => borrowedApprox(b) - borrowedApprox(a));
    if (tab === "New")
      arr.sort((a, b) => (b.publishedYear ?? 0) - (a.publishedYear ?? 0));
    return arr.slice(0, 18);
  }, [books, tab]);

  // helpers for follows
  const isFollowing = (name) =>
    following.includes((name || "").trim().toLowerCase());
  const toggleFollow = async (a) => {
    try {
      if (isFollowing(a.name)) {
        await unfollowAuthor(a.id || a.name);
        setFollowing((list) =>
          list.filter((n) => n !== a.name.trim().toLowerCase())
        );
      } else {
        await followAuthor(a.id || a.name);
        setFollowing((list) => [...list, a.name.trim().toLowerCase()]);
      }
    } catch (e) {
      alert(e?.message || "Failed to update follow.");
    }
  };

  // pick top 5 authors by booksCount
  const topAuthors = useMemo(() => {
    return [...(trendingAuthors || [])]
      .sort((a, b) => (b.booksCount ?? 0) - (a.booksCount ?? 0))
      .slice(0, 5);
  }, [trendingAuthors]);

  return (
    <div className="layout">
      <aside className="side">
        <div className="brand">📚 eLibrary</div>
        <nav
          className="nav"
          style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}
        >
          <a className="chip chip-active">Home</a>
          <a className="chip">Discover</a>
          <a className="chip">Bookmark</a>
          <a className="chip">Settings</a>
          <a className="chip">Help</a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <input
            placeholder="Search books, authors…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="avatar" />
        </header>

        <section className="tabs">
          {["Popular", "Top", "New"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={"chip " + (tab === t ? "chip-active" : "")}
            >
              {t === "Top" ? "Top Selling" : t}
            </button>
          ))}
        </section>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="grid">
            {shown.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </main>

      <aside className="rail">
        <section className="panel">
          <h3>Trending Authors</h3>
          <TrendingAuthors
            authors={topAuthors}
            following={following}
            onToggle={toggleFollow}
          />
        </section>
      </aside>
    </div>
  );
}

function BookCard({ book }) {
  const detailsTo = `/books/${book.id}`;
  const authorTo = `/author/${encodeURIComponent(book.author || "Unknown")}`;

  return (
    <div className="card book">
      {/* Cover → Book details */}
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
        {/* Title → Book details */}
        <Link
          to={detailsTo}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="title" title={book.title}>
            {book.title}
          </div>
        </Link>

        {/* Author → Author page */}
        <div className="author">
          <Link to={authorTo} style={{ textDecoration: "none" }}>
            {book.author || "Unknown"}
          </Link>
        </div>

        <div className="sub">
          ⭐ {(book.averageRating ?? 0).toFixed?.(1) ?? 0} ·{" "}
          {book.publishedYear ?? "—"}
        </div>
      </div>
    </div>
  );
}

// NEW: uses listAuthors results (photo + booksCount) and real follow/unfollow
function TrendingAuthors({ authors, following, onToggle }) {
  const isFollowing = (name) =>
    following.includes((name || "").trim().toLowerCase());

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {authors.map((a) => {
        const initial = (a.name || "?").slice(0, 1).toUpperCase();
        return (
          <li
            key={a.id || a.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
            }}
          >
            <div
              className="avatar"
              style={{
                width: 28,
                height: 28,
                backgroundImage: a.photoUrl ? `url(${a.photoUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#58627a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-hidden
            >
              {!a.photoUrl && initial}
            </div>

            <div style={{ flex: 1 }}>
              <Link
                to={`/author/${encodeURIComponent(a.name)}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ fontWeight: 600 }}>{a.name}</div>
              </Link>
              <div className="muted">
                {a.booksCount ?? 0}{" "}
                {(a.booksCount ?? 0) === 1 ? "book" : "books"}
              </div>
            </div>

            <button
              className="button secondary"
              style={{ padding: "6px 10px" }}
              onClick={() => onToggle(a)}
            >
              {isFollowing(a.name) ? "Following" : "Follow"}
            </button>
          </li>
        );
      })}
      {authors.length === 0 && (
        <li>
          <small className="muted">No authors yet.</small>
        </li>
      )}
    </ul>
  );
}
