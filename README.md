# Alohi Auth Shield — E2E & Manual QA

**Goal:** Unified, security-focused authentication testing across Alohi products (Sign.Plus, Fax.Plus, Dial.Plus). This repo contains Playwright E2E tests for login, reset, session, SSO/logout, cookie/security headers, plus a concise manual QA strategy and test scenarios.

**Live app (landing page):** [https://alohi-auth-shield.lovable.app/](https://alohi-auth-shield.lovable.app/)

---

## 📋 Contents

* **Playwright E2E tests** for:
  - Login (happy path)
  - Input normalization
  - Accessibility error surfacing
  - Lockout
  - Password reset (generic, non-enumerating)
  - Cross-app SSO & logout verification
  - Security headers & cookie flags
* **Manual QA**
  - Strategy (1–2 pages)
  - Test scenarios/cases (spreadsheet)
* **CI** (GitHub Actions): headless E2E with secure secrets and artifacts (HTML report)

---

## 📁 Repo Structure

```
.
├─ src/
│  ├─ pages/
│  │  ├─ LoginPage.ts
│  │  └─ ResetRequestPage.ts
│  ├─ utils/
│  │  ├─ ui.ts               # helpers (visibleAny, user menu, etc.)
│  │  ├─ cookies.ts          # session cookie helpers
│  │  ├─ security.ts         # cache/HSTS helpers
│  │  └─ testData.ts         # routes, apps, users (reads from env)
├─ tests/
│  ├─ login.happy.spec.ts
│  ├─ email.normalization.spec.ts
│  ├─ inputs.normalization.spec.ts
│  ├─ accessibility.login.aria.spec.ts
│  ├─ rate.limit.lockout.spec.ts
│  ├─ reset.password.request.spec.ts
│  ├─ cookies.flags.spec.ts
│  ├─ cross.apps.sso.logout.spec.ts
│  └─ sso.open.apps.spec.ts         # optional, gated by env if needed
├─ playwright.config.ts
├─ .github/workflows/e2e.yml
├─ README.md
└─ docs/
   ├─ Alohi_Authentication_Flow_Manual_QA_Test_Strategy.pdf
   └─ Alohi_Test_Cases.xlsx
```

---

## ⚙️ Prerequisites

* Node.js 18+ (CI uses Node 20)
* Chrome (Playwright will install browsers automatically)

---

## 🔐 Environment Variables

Create a local `.env` file (not committed). **Never commit credentials**.

```ini
# Auth credentials for a test account
AUTH_EMAIL=your_test_email@example.com
AUTH_PASS=your_strong_password

# Full OIDC authorize URL (Identity). If omitted, config will build a safe default.
ID_LOGIN_URL="https://id.alohi.com/realms/alohi/protocol/openid-connect/auth?client_id=app-selector&redirect_uri=https%3A%2F%2Fid.alohi.com%2Frealms%2Falohi%2Fapp-selector&response_type=code&code_challenge_method=S256"

# Product apps
SIGN_URL=https://app.sign.plus/
FAX_URL=https://app.fax.plus/
DIAL_URL=https://app.dial.plus/

# Lockout threshold used by the rate limit test
LOCKOUT_N=5

# Optional: narrow tests by tag (e.g., '@p0|@security|@a11y')
# GREP=@p0|@security
```

> **CI Setup:** In GitHub, set `AUTH_EMAIL` and `AUTH_PASS` as **Actions → Secrets**. Do **not** store secrets in the YAML.

---

## 🚀 Install & Run (Local)

### Installation

```bash
npm ci
npx playwright install --with-deps
```

### Run all tests (headless)

```bash
npx playwright test
```

### Headed mode (debug visually)

```bash
npx playwright test --headed
```

### Run a single file

```bash
npx playwright test tests/login.happy.spec.ts
```

### Run by grep/tag

```bash
npx playwright test --grep "@p0|@security"
```

### Show last report

```bash
npx playwright show-report
```
---

## ✅ What the E2E Tests Cover

### @smoke @p0
* `login.happy.spec.ts` — 2-step login works
* `cross.apps.sso.logout.spec.ts` — Login once → open Sign, Dial, Fax → logout → verify apps require login

### @p1
* `email.normalization.spec.ts` / `inputs.normalization.spec.ts` — trimming/case normalization

### @a11y
* `accessibility.login.aria.spec.ts` — errors announced (ARIA roles/live regions/common patterns)

### @security
* `cookies.flags.spec.ts` — Secure/HttpOnly/SameSite, no token leakage to `document.cookie`
* `security.headers.spec.ts` — cache policy on OIDC authorize (no-store/private) and HSTS

### Other
* `rate.limit.lockout.spec.ts` — generic error per attempt; no user enumeration; lockout messaging allowed
* `reset.password.request.spec.ts` — generic reset flow (non-enumerating), generous timeouts

> The `LoginPage`/`ResetRequestPage` & `utils/ui.ts` are robust to 1-step/2-step variants and common UI skins (labels, placeholders, IDs, roles, data-testids).

---

## 🔄 CI (GitHub Actions)

**Workflow:** `.github/workflows/e2e.yml`

* Installs deps & browsers
* Runs Playwright tests **headless**
* Uploads HTML report on all outcomes; traces/videos on failure
* Reads secrets from Actions → Secrets

### Required Secrets

Set in repo → Settings → Secrets and variables → Actions:

* `AUTH_EMAIL`
* `AUTH_PASS`

Optional env set inline (public):
* `SIGN_URL`, `FAX_URL`, `DIAL_URL`, `LOCKOUT_N` (as in the YAML)

> If staging IdP doesn't propagate global logout reliably, temporarily scope CI via `GREP` to exclude cross-app logout, or keep it locally only. The test files already try tolerant checks but CI networks can be flaky.

---

## 🔧 Troubleshooting

### Login field not found / timeouts in CI

* Ensure `ID_LOGIN_URL` is reachable from GitHub runners and not IP-blocked
* Confirm the login page actually renders a visible "Email/Username" field without cookie banners or consent walls blocking interaction
* If a cookie/consent modal exists, wire its close selector in `utils/ui.ts > closeAnyModal`

### Global logout doesn't invalidate apps in CI

Some IdP setups delay global session revocation. The test calls both UI logout and fallback endpoint attempts; still, propagation can be slow. Consider:

* Add a short poll (already present) and a final hard reload before asserting login form
* Run SSO/logout locally or behind `GREP` in CI if staging infra doesn't guarantee it

### Password reset page not found

The `ResetRequestPage.gotoViaLogin()` clicks "Forgot password" either on email or password step. If your skin nests it inside a menu, add that selector in `LoginPage.clickForgot()` or `utils/ui.ts`.

### Never commit secrets

If you accidentally did, rotate them **immediately** and rewrite history.

---

## 📚 Manual QA (Strategy & Cases)

* **Test Strategy (PDF):** `docs/Alohi_Authentication_Flow_Manual_QA_Test_Strategy.pdf`
  
  Scope: Login/Signup for Free & Enterprise, reset, session mgmt, SSO/logout, security hygiene, a11y.
  
  Prioritization: P0/P1/P2 by risk × impact × frequency.
  
  Evidence: screenshots, HAR, headers, cookies, console.

* **Test Cases (XLSX):** `docs/Alohi_Test_Cases.xlsx`
  
  Includes happy paths, negative/edge, tenant isolation, lockout, reset token states, cross-app identity propagation.

---

## 🏷️ Conventions

* **Tags:** `@smoke`, `@p0`, `@p1`, `@security`, `@a11y` — use `--grep` in local runs or CI
* **Artifacts:** HTML report (`playwright-report`) always uploaded; `test-results` (traces/videos) on failure
* **Selectors:** Prefer semantic (role/label/placeholder), then data-testids, then minimal CSS. Avoid brittle XPaths

---

## 📦 Scripts (Optional)

Add to `package.json` for convenience:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:p0": "playwright test --grep '@p0'",
    "test:security": "playwright test --grep '@security'",
    "test:a11y": "playwright test --grep '@a11y'",
    "report": "playwright show-report"
  }
}
```
---

## 📄 License

Internal QA tooling for Alohi evaluation. Do not distribute test credentials or sensitive data.

---

## 💝 Credits

Built with ❤️ using [Playwright](https://playwright.dev). Manual QA & E2E authored for Alohi Auth Shield assessment.

---