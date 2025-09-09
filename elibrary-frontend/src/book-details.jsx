import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookDetails, listReviews, upsertReview } from "./api.js";

function Stars({ value }) {
  const full = Math.round(value || 0);
  return (
    <span title={value?.toFixed ? value.toFixed(1) : value}>
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

  if (!book) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2>{book.title}</h2>
      <div className="flex">
        <div>
          <b>Author:</b> {book.author}
        </div>
        <div>
          <b>Genre:</b> {book.genre || "-"}
        </div>
        <div>
          <b>Rating:</b> <Stars value={book.avgRating || 0} /> (
          {book.reviewsCount || 0})
        </div>
      </div>
      {book.description && <p>{book.description}</p>}

      <h3>Reviews</h3>
      <div>
        {reviews.length === 0 && <small>No reviews yet.</small>}
        {reviews.map((r) => (
          <div
            key={r.id}
            className="card"
            style={{ margin: "8px 0", padding: "12px" }}
          >
            <div className="flex">
              <b>{r.username}</b> <Stars value={r.rating} />
              <small className="right">
                {new Date(r.createdAt).toLocaleString()}
              </small>
            </div>
            {r.comment && <p style={{ marginTop: 4 }}>{r.comment}</p>}
          </div>
        ))}
      </div>

      {user && (
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
          />
          <button className="button">Save Review</button>
          {msg && <small>{msg}</small>}
        </form>
      )}
      {!user && <small>Login to leave a review.</small>}
    </div>
  );
}
