import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookDetails, listReviews, upsertReview } from "./api.js";

function Stars({ value }) {
  const full = Math.round(value || 0);
  const label = value?.toFixed ? value.toFixed(1) : `${value ?? 0}`;
  return (
    <span className="badge" title={label}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

export default function BookDetails({ user }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const b = await getBookDetails(id);
    setBook(b);
    const r = await listReviews(id);
    setReviews(r);
  };
  useEffect(() => {
    load();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await upsertReview(id, Number(rating), comment);
      setMsg("Review saved");
      setComment("");
      await load();
    } catch {
      setMsg("Failed to save review (are you logged in?)");
    }
  };

  if (!book) return <div className="card">Loading…</div>;

  return (
    <div className="card">
      <div
        style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}
      >
        <div
          className="cover"
          style={{
            borderRadius: 12,
            backgroundImage: `url(${book.coverUrl || ""})`,
          }}
        />
        <div>
          <h2 style={{ marginBottom: 6 }}>{book.title}</h2>
          <div className="row" style={{ gap: 20 }}>
            <div>
              <b>Author:</b> {book.author}
            </div>
            <div>
              <b>Genre:</b> {book.genre || "-"}
            </div>
            <div>
              <b>Rating:</b> <Stars value={book.avgRating || 0} />{" "}
              <small>({book.reviewsCount || 0})</small>
            </div>
          </div>
          {book.description && (
            <p style={{ marginTop: 8 }}>{book.description}</p>
          )}
        </div>
      </div>

      <h3 style={{ marginTop: 16 }}>Reviews</h3>
      <div>
        {reviews.length === 0 && <small>No reviews yet.</small>}
        {reviews.map((r) => (
          <div
            key={r.id}
            className="card"
            style={{ margin: "10px 0", padding: "12px" }}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="avatar" style={{ width: 28, height: 28 }} />
                <b>{r.username}</b> <Stars value={r.rating} />
              </div>
              <small>{new Date(r.createdAt).toLocaleString()}</small>
            </div>
            {r.comment && <p style={{ marginTop: 6 }}>{r.comment}</p>}
          </div>
        ))}
      </div>

      {user ? (
        <form onSubmit={submit} className="row" style={{ marginTop: 12 }}>
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
          <input
            placeholder="Optional comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="button">Save Review</button>
          {msg && <small>{msg}</small>}
        </form>
      ) : (
        <small>Login to leave a review.</small>
      )}
    </div>
  );
}
