import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listBooks, borrow } from "./api.js";

function Stars({ value }) {
  const full = Math.round(value || 0);
  const label =
    typeof value === "number" && !Number.isNaN(value)
      ? value.toFixed(1)
      : "0.0";
  return (
    <span className="stars" title={label}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

export default function Books({ user }) {
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setMessage("");
    const res = await listBooks({
      q,
      author,
      genre,
      availableOnly,
      page: 1,
      pageSize: 50,
    });
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doBorrow = async (bookId) => {
    try {
      await borrow(bookId);
      setMessage("Borrowed successfully");
      await load();
    } catch {
      setMessage("Borrow failed (maybe unavailable or not logged in)");
    }
  };

  return (
    <div className="card">
      <h2>Books</h2>
      <div className="row">
        <input
          placeholder="Search title/author/isbn/genre"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
        <label className="flex">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />{" "}
          Available only
        </label>
        <button className="button" onClick={load} disabled={loading}>
          Search
        </button>
      </div>

      {message && <small>{message}</small>}

      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Rating</th>
            <th>Available</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((b) => (
            <tr key={b.id}>
              <td>
                <Link to={`/books/${b.id}`}>{b.title}</Link>
              </td>
              <td>{b.author}</td>
              <td>{b.genre || "-"}</td>
              <td>
                <Stars value={b.avgRating || 0} />
              </td>
              <td>{b.availableCopies}</td>
              <td>
                <button
                  className="button"
                  disabled={!user || b.availableCopies <= 0}
                  onClick={() => doBorrow(b.id)}
                >
                  Borrow
                </button>
              </td>
            </tr>
          ))}
          {data.items.length === 0 && (
            <tr>
              <td colSpan={6}>
                <small>No books found.</small>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
