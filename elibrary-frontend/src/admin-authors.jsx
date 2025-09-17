import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  listAuthors,
  createAuthor,
  getAuthor,
  updateAuthor,
  deleteAuthor,
} from "./api";

function AdminTabs({ active }) {
  return (
    <div className="admin-tabs">
      <NavLink
        to="/admin/books"
        className={({ isActive }) =>
          "tab" +
          (active === "books" || (isActive && active !== "authors")
            ? " active"
            : "")
        }
      >
        Books
      </NavLink>
      <NavLink
        to="/admin/authors"
        className={({ isActive }) =>
          "tab" + (active === "authors" || isActive ? " active" : "")
        }
      >
        Authors
      </NavLink>
    </div>
  );
}

const empty = { name: "", photoUrl: "", bio: "" };

export default function AdminAuthors() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (query = "") => {
    const list = await listAuthors(query);
    setItems(list || []);
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setError("");
  };

  const startEdit = async (id) => {
    setBusy(true);
    setError("");
    try {
      const a = await getAuthor(id);
      setEditingId(id);
      setForm({
        name: a.name || "",
        photoUrl: a.photoUrl || "",
        bio: a.bio || "",
      });
    } catch (e) {
      setError(e.message || "Failed to load author.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (editingId) await updateAuthor(editingId, form);
      else await createAuthor(form);
      reset();
      await load(q);
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (a.booksCount > 0) {
      alert(
        "Cannot delete: author has books. Reassign or delete those books first."
      );
      return;
    }
    if (!confirm(`Delete "${a.name}"?`)) return;
    setBusy(true);
    try {
      await deleteAuthor(a.id);
      await load(q);
    } catch (e) {
      alert(e.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((a) => (a.name || "").toLowerCase().includes(t));
  }, [items, q]);

  return (
    <div className="container">
      <AdminTabs active="authors" />

      <div className="card">
        <h2>Admin • Authors</h2>
        <form className="row" onSubmit={submit} autoComplete="off">
          <div
            className="avatar"
            style={{
              backgroundImage: form.photoUrl ? `url(${form.photoUrl})` : "",
              width: 56,
              height: 56,
            }}
          >
            {!form.photoUrl && (form.name || "?").slice(0, 1).toUpperCase()}
          </div>
          <input
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            placeholder="Photo URL (optional)"
            value={form.photoUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, photoUrl: e.target.value }))
            }
          />
          <input
            placeholder="Short bio (optional)"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            style={{ flex: 2 }}
          />
          <button className="button" disabled={busy || !form.name.trim()}>
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button type="button" className="button secondary" onClick={reset}>
              Cancel
            </button>
          )}
        </form>
        {error && <small style={{ color: "#c62828" }}>{error}</small>}
      </div>

      <div className="card">
        <div className="list-head">
          <input
            placeholder="Search authors…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Books</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      className="avatar sm"
                      style={{
                        backgroundImage: a.photoUrl ? `url(${a.photoUrl})` : "",
                      }}
                    >
                      {!a.photoUrl && (a.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div>{a.name}</div>
                  </div>
                </td>
                <td>{a.booksCount}</td>
                <td className="actions">
                  <button
                    className="button secondary"
                    onClick={() => startEdit(a.id)}
                  >
                    Edit
                  </button>
                  <button className="button danger" onClick={() => remove(a)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <small>No authors found.</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
