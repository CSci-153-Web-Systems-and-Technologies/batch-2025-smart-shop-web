"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Demo submit", { username, password });
    alert("Demo: form submitted — no backend configured.");
  }

  function handleGmail() {
    alert("Gmail sign-in placeholder (no backend configured).");
  }

  return (
    <div className="landing-bg">
      <div className="container">
        <div className="auth-card">
          <div className="left">
            <h1 className="brand">ShopSmart</h1>
            <p className="tagline">Streamline Your Store Operations</p>

            <button
              className="gmail-btn"
              onClick={handleGmail}
              aria-label="Sign in with Gmail"
            >
              <span className="gmail-mark" aria-hidden>
                ✉️
              </span>
              Log In Using Gmail
            </button>
          </div>

          <div className="right">
            <h2 className="login-title">Login</h2>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="input-wrap">
                <span className="visually-hidden">Username</span>
                <input
                  className="text-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  aria-label="Username"
                />
              </label>

              <label className="input-wrap">
                <span className="visually-hidden">Password</span>
                <input
                  className="text-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                />
              </label>

              <button className="login-btn" type="submit">
                Log in
              </button>

              <div className="small-links">
                <a className="muted">Forgot Password?</a>
                <div className="signup">
                  Don't have an account?{" "}
                  <Link href="/signup" className="signup-link">
                    Sign Up Here!
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
