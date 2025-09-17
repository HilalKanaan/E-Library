import React, { useEffect, useState } from "react";
import { myBorrows, returnBorrow, renewBorrow } from "./api.js";

export default function MyBorrows() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [renewLoadingId, setRenewLoadingId] = useState(null);

  // Keep in sync with backend limit (server still enforces it)
  const MAX_RENEWALS_UI = 2;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await myBorrows();
    setItems(res);
  }

  function isOverdue(b) {
    try {
      return new Date(b.dueAt).getTime() < Date.now();
    } catch {
      return false;
    }
  }

  function canRenew(b) {
    const renewals = b.renewalsCount ?? 0;
    return (
      b.status === "Borrowed" && !isOverdue(b) && renewals < MAX_RENEWALS_UI
    );
  }

  async function doReturn(id) {
    try {
      // Optional: optimistic remove/update instead of full reload
      await returnBorrow(id);
      setMsg("Returned successfully");
      // Update just that row locally
      setItems((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                returnedAt: new Date().toISOString(),
                status: isOverdue(b) ? "Overdue" : "Returned",
              }
            : b
        )
      );
    } catch (e) {
      setMsg(e.message || "Return failed");
    }
  }

  async function doRenew(borrow) {
    try {
      setRenewLoadingId(borrow.id);
      const res = await renewBorrow(borrow.id);
      setMsg(res?.message || "Renewed successfully");

      // ✅ No full reload — update just this row (kills flicker)
      setItems((prev) =>
        prev.map((b) =>
          b.id === borrow.id
            ? { ...b, dueAt: res.newDueAt, renewalsCount: res.renewalsCount }
            : b
        )
      );
    } catch (e) {
      setMsg(e.message || "Renew failed");
    } finally {
      setRenewLoadingId(null);
    }
  }

  return (
    <div className="card">
      <h2>My Borrows</h2>

      {/* Reserve space so the layout doesn't jump when messages appear */}
      <div className="flash-msg" role="status" aria-live="polite">
        {msg}
      </div>

      <table className="table borrows-table">
        <colgroup>
          <col className="col-title" />
          <col className="col-borrowed" />
          <col className="col-due" />
          <col className="col-status" />
          <col className="col-actions" />
        </colgroup>

        <thead>
          <tr>
            <th>Title</th>
            <th>Borrowed At</th>
            <th>Due</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((b) => {
            const renewals = b.renewalsCount ?? 0;
            const overdue = isOverdue(b);
            return (
              <tr key={b.id}>
                <td>{b.book?.title}</td>
                <td>{new Date(b.borrowedAt).toLocaleString()}</td>
                <td>
                  {new Date(b.dueAt).toLocaleString()}
                  {overdue && <span className="badge ml-2">Overdue</span>}
                </td>
                <td>
                  <span className="badge">{b.status}</span>
                  <div className="muted">
                    Renewals: {renewals}/{MAX_RENEWALS_UI}
                  </div>
                </td>
                <td className="actions-cell">
                  <div className="actions">
                    {!b.returnedAt && (
                      <button className="button" onClick={() => doReturn(b.id)}>
                        Return
                      </button>
                    )}
                    {canRenew(b) && (
                      <button
                        className="button"
                        disabled={renewLoadingId === b.id}
                        onClick={() => doRenew(b)}
                        title={`You can renew ${
                          MAX_RENEWALS_UI - renewals
                        } more time(s)`}
                      >
                        {renewLoadingId === b.id ? "Renewing…" : "Renew"}
                      </button>
                    )}
                    {/* Keep height/spacing even when no actions */}
                    {!canRenew(b) && b.returnedAt && (
                      <span className="actions-placeholder" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
