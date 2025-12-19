"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, signInWithGoogle } from "@/lib/auth-action";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await login(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      if (result?.success) {
        router.push("/mainpos");
      }
    } catch (err: any) {
      setError("An error occurred. Please try again.");
      console.error(err);
      setLoading(false);
    }
  }

  async function handleGmail() {
    try {
      setError("");
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError("Failed to sign in with Google");
      console.error(err);
    }
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
              type="button"
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
              {error && <div className="error-message">{error}</div>}

              <label className="input-wrap">
                <span className="visually-hidden">Email</span>
                <input
                  className="text-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  aria-label="Email"
                  required
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
                  required
                />
              </label>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
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
