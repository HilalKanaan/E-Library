import React, { useState } from "react";
import { register } from "./api.js";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("user1");
  const [password, setPassword] = useState("pass123");
  const [fullName, setFullName] = useState("Test User");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await register({ username, password, fullName });
      setMsg("User created. Redirecting to login…");
      setTimeout(() => nav("/login"), 800);
    } catch {
      setMsg("Failed to register");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: "32px auto" }}>
      <h2>Create your account</h2>
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
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <button className="button">Create</button>
      </form>
      {msg && <small>{msg}</small>}
    </div>
  );
}
