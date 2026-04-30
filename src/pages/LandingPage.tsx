import { useState } from "react";

import { BrandLockup } from "../components/BrandLockup";
import { useAuth } from "../hooks/useAuth";

export function LandingPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegisterMode = mode === "register";
  const passwordTooShort = isRegisterMode && password.length > 0 && password.length < 8;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRegisterMode && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(displayName, email, password);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="landing-layout">
      <section className="hero-panel">
        <BrandLockup subtitle="Shared shelves for book-loving teams" titleAs="p" />
        <h1>Wormie lets your team lend or trade physical books with each other.</h1>
        <p className="hero-copy">
          Post your shelf, make barter offers, and track borrowed books before they disappear into someone else's desk
          pile.
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-toggle">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Log In
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Sign Up
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">{mode === "login" ? "Welcome back" : "Create your Wormie account"}</p>
            <h2>{mode === "login" ? "Log in to start sharing" : "Start sharing your books"}</h2>
          </div>

          {mode === "register" ? (
            <label className="field">
              <span>Display name</span>
              <input
                className="text-input"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input className="text-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              className={`text-input${passwordTooShort ? " input-invalid" : ""}`}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isRegisterMode ? 8 : undefined}
              aria-invalid={passwordTooShort}
              required
            />
            {isRegisterMode ? (
              <small className={`field-hint${passwordTooShort ? " field-hint-warning" : ""}`}>
                Password must be at least 8 characters.
              </small>
            ) : null}
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "login" ? "Log In" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
