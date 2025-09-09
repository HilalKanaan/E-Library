import React, { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { login, me } from "./api.js";
import Books from "./books.jsx";
import MyBorrows from "./myborrows.jsx";
import AdminBooks from "./admin-books.jsx";
import Register from "./register.jsx";
import BookDetails from "./book-details.jsx";

function Nav({ user, onLogout }) {
  return (
    <div className="nav container">
      <div className="flex">
        <strong>📚 eLibrary</strong>
        <Link to="/">Books</Link>
        {user && <Link to="/my-borrows">My Borrows</Link>}
        {user?.role === "Admin" && <Link to="/admin/books">Admin</Link>}
      </div>
      <div className="flex right">
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <small>
            Signed in as <b>{user.username}</b> ({user.role})
          </small>
        )}
        {user && (
          <button className="button secondary" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

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
      <div className="container">
        <Routes>
          <Route path="/" element={<Books user={user} />} />
          <Route path="/login" element={<Login onLoggedIn={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/my-borrows"
            element={user ? <MyBorrows /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin/books"
            element={
              user?.role === "Admin" ? (
                <AdminBooks />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/books/:id" element={<BookDetails user={user} />} />
        </Routes>
      </div>
    </>
  );
}

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
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="card">
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
