import React, { useEffect, useMemo, useRef, useState } from "react";
import { listBooks, createBook, updateBook, deleteBook } from "./api.js";
import { listAuthors, createAuthor, getBook } from "./api.js";
import { NavLink } from "react-router-dom";

const empty = {
  isbn: "",
  title: "",
  genre: "",
  publishedYear: 2020,
  description: "",
  coverUrl: "",
  totalCopies: 1,
  availableCopies: 1,
};

function AdminTabs({ active }) {
  return (
    <div className="admin-tabs">
      <NavLink
        to="/admin/books"
        className={({ isActive }) =>
          "tab" + (active === "books" || isActive ? " active" : "")
        }
      >
        Books
      </NavLink>
      <NavLink
        to="/admin/authors"
        className={({ isActive }) =>
          "tab" + (active === "authors" ? " active" : "")
        }
      >
        Authors
      </NavLink>
    </div>
  );
}

export default function AdminBooks() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  // Author picker state
  const [authorQ, setAuthorQ] = useState("");
  const [authorId, setAuthorId] = useState(null);
  const [authorOpts, setAuthorOpts] = useState([]);
  const [authorOpen, setAuthorOpen] = useState(false);
  const [busyAuthor, setBusyAuthor] = useState(false);
  const dropdownRef = useRef(null);

  const load = async () => {
    const res = await listBooks({ page: 1, pageSize: 100 });
    setData(res);
  };
  useEffect(() => {
    load();
  }, []);

  // Close author dropdown on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAuthorOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Debounced author search
  useEffect(() => {
    let tm = setTimeout(async () => {
      try {
        const res = await listAuthors(authorQ || "");
        setAuthorOpts(res || []);
      } catch {}
    }, 200);
    return () => clearTimeout(tm);
  }, [authorQ]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // When editing, fetch full book (to get AuthorId)
  const edit = async (b) => {
    setEditingId(b.id);
    try {
      const full = await getBook(b.id);
      setForm({
        isbn: full.isbn || "",
        title: full.title || "",
        genre: full.genre || "",
        publishedYear: full.publishedYear ?? 2020,
        description: full.description || "",
        coverUrl: full.coverUrl || "",
        totalCopies: full.totalCopies ?? 1,
        availableCopies: full.availableCopies ?? 1,
      });
      setAuthorId(full.authorId || null);
      setAuthorQ(full.author || "");
    } catch {
      setForm((f) => ({ ...f, title: b.title, genre: b.genre || "" }));
      setAuthorQ(b.author || "");
      setAuthorId(null);
    }
    setAuthorOpen(false);
  };

  const resetForm = () => {
    setForm(empty);
    setEditingId(null);
    setAuthorQ("");
    setAuthorId(null);
    setAuthorOpen(false);
  };

  const ensureAuthorSelectedOrCreate = async () => {
    if (authorId) return authorId;
    const name = (authorQ || "").trim();
    if (!name) throw new Error("Please select or enter an author.");
    const exact = authorOpts.find(
      (a) => a.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (exact) return exact.id;
    setBusyAuthor(true);
    try {
      const created = await createAuthor(name);
      setAuthorOpts((opts) => [
        { id: created.id, name: created.name, booksCount: 0 },
        ...opts,
      ]);
      setAuthorId(created.id);
      return created.id;
    } finally {
      setBusyAuthor(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const resolvedAuthorId = await ensureAuthorSelectedOrCreate();
      const payload = { ...form, authorId: resolvedAuthorId };
      if (editingId) await updateBook(editingId, payload);
      else await createBook(payload);
      resetForm();
      await load();
    } catch (err) {
      alert(err.message || "Failed to save book.");
    }
  };

  const remove = async (id) => {
    if (confirm("Delete this book?")) {
      await deleteBook(id);
      await load();
    }
  };

  const pickAuthor = (a) => {
    setAuthorId(a.id);
    setAuthorQ(a.name);
    setAuthorOpen(false);
  };

  const canSubmit = useMemo(() => {
    return (form.title || "").trim() && (authorQ || "").trim();
  }, [form.title, authorQ]);

  return (
    <>
      {/* Admin sub-tabs */}
      <AdminTabs active="books" />

      <div className="card">
        <h2>Admin • Books</h2>
        <form className="row" onSubmit={submit} autoComplete="off">
          <input
            placeholder="ISBN"
            value={form.isbn}
            onChange={(e) => set("isbn", e.target.value)}
          />
          <input
            placeholder="Title *"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />

          {/* Author Picker */}
          <div
            className="author-picker"
            ref={dropdownRef}
            style={{ position: "relative", minWidth: 240 }}
          >
            <input
              placeholder="Author * (type to search)"
              value={authorQ}
              onChange={(e) => {
                setAuthorQ(e.target.value);
                setAuthorId(null);
                setAuthorOpen(true);
              }}
              onFocus={() => setAuthorOpen(true)}
            />
            {authorOpen && (
              <div className="dropdown">
                {authorOpts.length === 0 && (
                  <div className="dropdown-item muted">No matches</div>
                )}
                {authorOpts.map((a) => (
                  <div
                    key={a.id}
                    className="dropdown-item"
                    onClick={() => pickAuthor(a)}
                  >
                    {a.name}{" "}
                    {a.booksCount ? (
                      <small className="ml-2">({a.booksCount})</small>
                    ) : null}
                  </div>
                ))}
                <div className="dropdown-footer">
                  <button
                    type="button"
                    className="button"
                    onClick={async () => {
                      try {
                        const id = await ensureAuthorSelectedOrCreate();
                        setAuthorId(id);
                      } catch (e) {
                        alert(e.message);
                      }
                    }}
                    disabled={busyAuthor || !(authorQ || "").trim()}
                  >
                    {busyAuthor ? "Creating…" : "Create new author"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <input
            placeholder="Genre"
            value={form.genre}
            onChange={(e) => set("genre", e.target.value)}
          />
          <input
            type="number"
            placeholder="Year"
            value={form.publishedYear}
            onChange={(e) => set("publishedYear", Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="Total"
            value={form.totalCopies}
            onChange={(e) => set("totalCopies", Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="Available"
            value={form.availableCopies}
            onChange={(e) => set("availableCopies", Number(e.target.value))}
          />
          <input
            placeholder="Cover URL (optional)"
            value={form.coverUrl}
            onChange={(e) => set("coverUrl", e.target.value)}
            style={{ flex: 1, minWidth: 240 }}
          />

          <button className="button" disabled={!canSubmit || busyAuthor}>
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="button secondary"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Available/Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>
                  {b.availableCopies}/{b.totalCopies}
                </td>
                <td className="actions">
                  <button className="button secondary" onClick={() => edit(b)}>
                    Edit
                  </button>
                  <button
                    className="button danger"
                    onClick={() => remove(b.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <small>No books yet.</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
