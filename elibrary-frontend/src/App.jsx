import React, { useEffect, useState, useRef } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  login,
  me,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./api.js";

import Home from "./home";
import Books from "./books.jsx";
import BookDetails from "./book-details.jsx";
import MyBorrows from "./myborrows.jsx";
import Register from "./register.jsx";
import Author from "./author.jsx";
import AdminBooks from "./admin-books.jsx";
import AdminAuthors from "./admin-authors.jsx";
import Profile from "./profile.jsx";

/* ---------- Nav ---------- */
function Nav({ user, onLogout }) {
  return (
    <header className="nav">
      <div className="nav-left">
        <strong className="brand">📚 eLibrary</strong>
        <NavLink to="/" end className="navlink">
          Home
        </NavLink>
        <NavLink to="/books" className="navlink">
          Books
        </NavLink>
        {user && (
          <NavLink to="/my-borrows" className="navlink">
            My Borrows
          </NavLink>
        )}
        {user && (
          <NavLink to="/me" className="navlink">
            Profile
          </NavLink>
        )}
        {user?.role === "Admin" && (
          <NavLink to="/admin/books" className="navlink">
            Admin
          </NavLink>
        )}
      </div>
      <div className="nav-right">
        {user && <NotificationBell />}
        {!user && (
          <NavLink to="/login" className="navlink">
            Login
          </NavLink>
        )}
        {!user && (
          <NavLink to="/register" className="navlink">
            Register
          </NavLink>
        )}
        {user && (
          <>
            <small>
              Signed in as <b>{user.username}</b> ({user.role})
            </small>
            <button className="button secondary" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}

/* ---------- Notifications bell ---------- */
function NotificationBell() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [busyAll, setBusyAll] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    let tm;
    const tick = async () => {
      try {
        const res = await listNotifications(true);
        setUnread(res.length || 0);
      } catch {}
      tm = setTimeout(tick, 30000);
    };
    tick();
    return () => clearTimeout(tm);
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const toggleMenu = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      try {
        const res = await listNotifications(false);
        setItems(res || []);
      } catch {}
    }
  };

  const timeAgo = (iso) => {
    try {
      const d = new Date(iso);
      const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
      if (s < 60) return `${Math.floor(s)}s`;
      if (s < 3600) return `${Math.floor(s / 60)}m`;
      if (s < 86400) return `${Math.floor(s / 3600)}h`;
      return `${Math.floor(s / 86400)}d`;
    } catch {
      return "";
    }
  };

  const openNotif = async (n) => {
    try {
      if (!n.isRead) {
        await markNotificationRead(n.id);
        setUnread((u) => Math.max(0, u - 1));
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
        );
      }
      let bookId = null;
      try {
        const data = n.dataJson ? JSON.parse(n.dataJson) : null;
        bookId = data?.bookId || data?.BookId || data?.id;
      } catch {}
      if (bookId) {
        setOpen(false);
        nav(`/books/${bookId}`);
      }
    } catch {}
  };

  const markAll = async () => {
    try {
      setBusyAll(true);
      await markAllNotificationsRead();
      setUnread(0);
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <div className="notif-box" ref={boxRef}>
      <button className="bell" onClick={toggleMenu} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2m6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1z"
          />
        </svg>
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif-menu">
          <div className="notif-head">
            <b>Notifications</b>
            <button
              className="button secondary"
              onClick={markAll}
              disabled={busyAll || unread === 0}
            >
              {busyAll ? "Marking…" : "Mark all read"}
            </button>
          </div>

          <div className="notif-list">
            {items.length === 0 && (
              <div className="notif-empty">
                <small>No notifications</small>
              </div>
            )}
            {items.slice(0, 12).map((n) => {
              let hasLink = false;
              try {
                const d = n.dataJson ? JSON.parse(n.dataJson) : null;
                hasLink = Boolean(d?.bookId || d?.BookId || d?.id);
              } catch {}
              return (
                <div
                  key={n.id}
                  className={"notif-item" + (n.isRead ? "" : " unread")}
                >
                  <div className="ni-main">
                    <div className="ni-title">{n.title || "Update"}</div>
                    <div className="ni-body">{n.body}</div>
                  </div>
                  <div className="ni-aside">
                    <small className="ni-time">{timeAgo(n.createdAt)}</small>
                    <div className="ni-actions">
                      <button
                        className="button secondary"
                        onClick={() => openNotif(n)}
                      >
                        {hasLink ? "View" : n.isRead ? "Open" : "Mark read"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const Container = ({ children }) => <div className="container">{children}</div>;

export default function App() {
  const [user, setUser] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      });
  }, []);

  const onLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    nav("/");
  };

  return (
    <>
      <Nav user={user} onLogout={onLogout} />
      <Routes>
        {/* Full-bleed Home */}
        <Route path="/" element={<Home />} />

        {/* Admin redirect */}
        <Route path="/admin" element={<Navigate to="/admin/books" replace />} />

        {/* Centered pages */}
        <Route
          path="/books"
          element={
            <Container>
              <Books user={user} />
            </Container>
          }
        />
        <Route
          path="/books/:id"
          element={
            <Container>
              <BookDetails user={user} />
            </Container>
          }
        />
        <Route
          path="/author/:name"
          element={
            <Container>
              <Author />
            </Container>
          }
        />

        <Route
          path="/my-borrows"
          element={
            user ? (
              <Container>
                <MyBorrows />
              </Container>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/books"
          element={
            user?.role === "Admin" ? (
              <Container>
                <AdminBooks />
              </Container>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/authors"
          element={
            user?.role === "Admin" ? (
              <Container>
                <AdminAuthors />
              </Container>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* NEW: Profile page */}
        <Route
          path="/me"
          element={
            user ? (
              <Container>
                <Profile />
              </Container>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={
            <Container>
              <Login onLoggedIn={setUser} />
            </Container>
          }
        />
        <Route
          path="/register"
          element={
            <Container>
              <Register />
            </Container>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

/* ---------- Simple login form ---------- */
function Login({ onLoggedIn }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(username, password);
      localStorage.setItem("token", res.token);
      onLoggedIn({ username: res.username, role: res.role });
      nav("/");
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: "32px auto" }}>
      <h2>Login</h2>
      <form onSubmit={submit} className="row">
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="button">Login</button>
      </form>
      {error && <small>{error}</small>}
    </div>
  );
}
