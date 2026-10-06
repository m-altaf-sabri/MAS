# MyIdentity Hub: Step-by-step build

Needs Node 20+ and PostgreSQL running locally.
OTP runs in **dev mode**: the code prints in the server terminal. Step 8 shows how to switch to Twilio.

## Step 1: Create the folders

```bash
mkdir myidentity-hub && cd myidentity-hub
mkdir -p server/src server/db client
```

## Step 2: Database

```bash
createdb identityhub
```

Create `server/db/schema.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE users(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), phone TEXT UNIQUE NOT NULL, name TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE otps(id SERIAL PRIMARY KEY, phone TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL, attempts INT DEFAULT 0, expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE social_accounts(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users ON DELETE CASCADE, provider TEXT NOT NULL, label TEXT, token_enc BYTEA, UNIQUE(user_id, provider));
CREATE TABLE documents(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users ON DELETE CASCADE, doc_type TEXT NOT NULL, number_masked TEXT, mime TEXT, file_path TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE audit_log(id BIGSERIAL PRIMARY KEY, user_id UUID, action TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
```

```bash
psql identityhub -f server/db/schema.sql
```

## Step 3: Backend setup

```bash
cd server
npm init -y
npm pkg set type=module
npm pkg set scripts.dev="nodemon src/index.js"
npm install express pg cors helmet dotenv jsonwebtoken express-rate-limit multer
npm install -D nodemon
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # copy this for MASTER_KEY
```

Create `server/.env`:

```
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/identityhub
JWT_SECRET=put-a-long-random-string-here
MASTER_KEY=paste-the-64-character-hex-here
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:4000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Adjust the Postgres user and password in `DATABASE_URL` to match yours.

## Step 4: Backend code

`server/src/db.js`

```js
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const q = (text, params) => pool.query(text, params).then((r) => r.rows);
```

`server/src/crypto.js` (AES-256-GCM)

```js
import crypto from "crypto";
const key = Buffer.from(process.env.MASTER_KEY, "hex");
export const encrypt = (buf) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]);
};
export const decrypt = (buf) => {
  const d = crypto.createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]);
};
export const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
```

`server/src/index.js`

```js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";
import { q } from "./db.js";
import { encrypt, decrypt, sha } from "./crypto.js";

const app = express();
app.use(helmet(), cors({ origin: process.env.CLIENT_URL }), express.json());
fs.mkdirSync("uploads", { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, f, cb) =>
    cb(
      null,
      ["image/jpeg", "image/png", "application/pdf"].includes(f.mimetype),
    ),
});
const sign = (id, exp = "15m") =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: exp });
const audit = (uid, a) =>
  q("INSERT INTO audit_log(user_id, action) VALUES($1,$2)", [uid, a]);
const auth = (req, res, next) => {
  try {
    req.uid = jwt.verify(
      (req.headers.authorization || "").slice(7),
      process.env.JWT_SECRET,
    ).id;
    next();
  } catch {
    res.status(401).json({ error: "Please log in again" });
  }
};
const loginLimit = rateLimit({
  windowMs: 3600e3,
  limit: 5,
  keyGenerator: (r) => String(r.body?.phone || "none"),
});
const viewLimit = rateLimit({
  windowMs: 3600e3,
  limit: 5,
  keyGenerator: (r) => String(r.uid),
});

// ---- OTP (dev mode: prints the code). Replace sendOtp/checkOtp with Twilio Verify in production.
async function sendOtp(phone, purpose) {
  const code = String(crypto.randomInt(100000, 1000000));
  await q("DELETE FROM otps WHERE phone=$1 AND purpose=$2", [phone, purpose]);
  await q(
    "INSERT INTO otps(phone, purpose, code_hash, expires_at) VALUES($1,$2,$3, now() + interval '5 minutes')",
    [phone, purpose, sha(code)],
  );
  console.log(`[DEV OTP] ${phone} (${purpose}): ${code}`);
}
async function checkOtp(phone, purpose, code) {
  const [o] = await q(
    "SELECT * FROM otps WHERE phone=$1 AND purpose=$2 AND expires_at > now()",
    [phone, purpose],
  );
  if (!o || o.attempts >= 5) return false;
  if (o.code_hash !== sha(String(code))) {
    await q("UPDATE otps SET attempts = attempts + 1 WHERE id=$1", [o.id]);
    return false;
  }
  await q("DELETE FROM otps WHERE id=$1", [o.id]);
  return true;
}
const phoneOf = async (uid) =>
  (await q("SELECT phone FROM users WHERE id=$1", [uid]))[0].phone;

// ---- Auth
app.post("/auth/otp/send", loginLimit, async (req, res) => {
  const { phone } = req.body;
  if (!/^\+\d{10,15}$/.test(phone || ""))
    return res.status(400).json({ error: "Use the format +919876543210" });
  await sendOtp(phone, "login");
  res.json({ ok: true });
});
app.post("/auth/otp/verify", async (req, res) => {
  const { phone, code } = req.body;
  if (!(await checkOtp(phone, "login", code)))
    return res.status(401).json({ error: "Wrong or expired code" });
  const [u] = await q(
    "INSERT INTO users(phone) VALUES($1) ON CONFLICT(phone) DO UPDATE SET phone=EXCLUDED.phone RETURNING id",
    [phone],
  );
  await audit(u.id, "login");
  res.json({ token: sign(u.id, "1h") });
});

// ---- Profile
app.get("/me", auth, async (req, res) =>
  res.json(
    (await q("SELECT id, phone, name FROM users WHERE id=$1", [req.uid]))[0],
  ),
);
app.patch("/me", auth, async (req, res) => {
  await q("UPDATE users SET name=$1 WHERE id=$2", [
    String(req.body.name || "").slice(0, 80),
    req.uid,
  ]);
  res.json({ ok: true });
});

// ---- Social (Google shown; Facebook/LinkedIn/X follow the same pattern with their own URLs)
const G = {
  auth: "https://accounts.google.com/o/oauth2/v2/auth",
  token: "https://oauth2.googleapis.com/token",
  info: "https://www.googleapis.com/oauth2/v3/userinfo",
};
const gRedirect = () => process.env.SERVER_URL + "/social/google/callback";
app.get("/social", auth, async (req, res) =>
  res.json(
    await q("SELECT provider, label FROM social_accounts WHERE user_id=$1", [
      req.uid,
    ]),
  ),
);
app.post("/social/google/connect", auth, async (req, res) => {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: gRedirect(),
    response_type: "code",
    scope: "openid profile email",
    state: sign(req.uid, "10m"),
  });
  await audit(req.uid, "consent.google");
  res.json({ url: `${G.auth}?${p}` });
});
app.get("/social/google/callback", async (req, res) => {
  try {
    const uid = jwt.verify(req.query.state, process.env.JWT_SECRET).id;
    const t = await (
      await fetch(G.token, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: req.query.code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: gRedirect(),
          grant_type: "authorization_code",
        }),
      })
    ).json();
    const i = await (
      await fetch(G.info, {
        headers: { Authorization: "Bearer " + t.access_token },
      })
    ).json();
    await q(
      "INSERT INTO social_accounts(user_id, provider, label, token_enc) VALUES($1,$2,$3,$4) ON CONFLICT(user_id, provider) DO UPDATE SET label=$3, token_enc=$4",
      [uid, "google", i.email, encrypt(Buffer.from(t.access_token))],
    );
    await audit(uid, "social.connect.google");
    res.redirect(process.env.CLIENT_URL);
  } catch {
    res.status(400).send("Could not connect. Close this tab and try again.");
  }
});
app.delete("/social/:provider", auth, async (req, res) => {
  await q("DELETE FROM social_accounts WHERE user_id=$1 AND provider=$2", [
    req.uid,
    req.params.provider,
  ]);
  await audit(req.uid, "social.disconnect." + req.params.provider);
  res.json({ ok: true });
});

// ---- Documents
const TYPES = [
  "aadhaar",
  "pan",
  "driving_licence",
  "passport",
  "voter_id",
  "other",
];
const mask = (n) => {
  const d = String(n).replace(/\s/g, "");
  return "X".repeat(Math.max(d.length - 4, 0)) + d.slice(-4);
};
app.get("/documents", auth, async (req, res) =>
  res.json(
    await q(
      "SELECT id, doc_type, number_masked FROM documents WHERE user_id=$1 ORDER BY created_at DESC",
      [req.uid],
    ),
  ),
);
app.post("/documents", auth, upload.single("file"), async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ error: "Upload a JPG, PNG or PDF under 5 MB" });
  const type = TYPES.includes(req.body.type) ? req.body.type : "other";
  const path = `uploads/${crypto.randomUUID()}.bin`;
  fs.writeFileSync(path, encrypt(req.file.buffer));
  await q(
    "INSERT INTO documents(user_id, doc_type, number_masked, mime, file_path) VALUES($1,$2,$3,$4,$5)",
    [req.uid, type, mask(req.body.number || ""), req.file.mimetype, path],
  );
  await audit(req.uid, "doc.upload");
  res.json({ ok: true });
});
app.post("/documents/:id/otp", auth, viewLimit, async (req, res) => {
  await sendOtp(await phoneOf(req.uid), "view");
  res.json({ ok: true });
});
app.post("/documents/:id/view", auth, async (req, res) => {
  if (!(await checkOtp(await phoneOf(req.uid), "view", req.body.code)))
    return res.status(401).json({ error: "Wrong or expired code" });
  const [d] = await q("SELECT * FROM documents WHERE id=$1 AND user_id=$2", [
    req.params.id,
    req.uid,
  ]);
  if (!d) return res.status(404).json({ error: "Document not found" });
  await audit(req.uid, "doc.view");
  res.type(d.mime).send(decrypt(fs.readFileSync(d.file_path)));
});
app.delete("/documents/:id", auth, async (req, res) => {
  const [d] = await q(
    "DELETE FROM documents WHERE id=$1 AND user_id=$2 RETURNING file_path",
    [req.params.id, req.uid],
  );
  if (d) fs.rmSync(d.file_path, { force: true });
  await audit(req.uid, "doc.delete");
  res.json({ ok: true });
});

// ---- Privacy
app.get("/privacy/audit", auth, async (req, res) =>
  res.json(
    await q(
      "SELECT action, created_at FROM audit_log WHERE user_id=$1 ORDER BY id DESC LIMIT 20",
      [req.uid],
    ),
  ),
);
app.delete("/privacy/data", auth, async (req, res) => {
  const docs = await q("SELECT file_path FROM documents WHERE user_id=$1", [
    req.uid,
  ]);
  docs.forEach((d) => fs.rmSync(d.file_path, { force: true }));
  await q("DELETE FROM audit_log WHERE user_id=$1", [req.uid]);
  await q("DELETE FROM users WHERE id=$1", [req.uid]); // cascades to documents + social_accounts
  res.json({ ok: true });
});

app.use((e, _req, res, _next) => {
  console.error(e);
  res.status(500).json({ error: "Something went wrong" });
});
app.listen(process.env.PORT || 4000, () =>
  console.log("API running on port " + (process.env.PORT || 4000)),
);
```

Run it:

```bash
npm run dev
```

## Step 5: Frontend setup

Open a second terminal in the project root:

```bash
npm create vite@latest client -- --template react
cd client
npm install
```

## Step 6: Frontend code

`client/src/api.js`

```js
const API = "http://localhost:4000";
let token = sessionStorage.getItem("t");
export const setToken = (t) => {
  token = t;
  t ? sessionStorage.setItem("t", t) : sessionStorage.removeItem("t");
};

export async function api(path, { method = "GET", body, raw } = {}) {
  const isForm = body instanceof FormData;
  const r = await fetch(API + path, {
    method,
    headers: {
      ...(token && { Authorization: "Bearer " + token }),
      ...(body && !isForm && { "Content-Type": "application/json" }),
    },
    body: isForm ? body : body && JSON.stringify(body),
  });
  if (!r.ok)
    throw new Error(
      (await r.json().catch(() => ({}))).error || "Request failed",
    );
  return raw ? r.blob() : r.json();
}
```

Replace `client/src/App.jsx`

```jsx
import { useEffect, useState } from "react";
import { api, setToken } from "./api";

export default function App() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("t"));
  return authed ? (
    <Dashboard
      onOut={() => {
        setToken(null);
        setAuthed(false);
      }}
    />
  ) : (
    <Login onDone={() => setAuthed(true)} />
  );
}

function Login({ onDone }) {
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const run = async (f) => {
    setErr("");
    try {
      await f();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <main>
      <h1>MyIdentity Hub</h1>
      <p>Log in with your mobile number.</p>
      {!sent ? (
        <>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
          />
          <button
            onClick={() =>
              run(async () => {
                await api("/auth/otp/send", {
                  method: "POST",
                  body: { phone },
                });
                setSent(true);
              })
            }
          >
            Send OTP
          </button>
        </>
      ) : (
        <>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
          />
          <button
            onClick={() =>
              run(async () => {
                const r = await api("/auth/otp/verify", {
                  method: "POST",
                  body: { phone, code },
                });
                setToken(r.token);
                onDone();
              })
            }
          >
            Verify and log in
          </button>
        </>
      )}
      {err && <p className="err">{err}</p>}
    </main>
  );
}

function Dashboard({ onOut }) {
  const [me, setMe] = useState(null);
  const [social, setSocial] = useState([]);
  const [docs, setDocs] = useState([]);
  const [log, setLog] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const [m, s, d, l] = await Promise.all([
        api("/me"),
        api("/social"),
        api("/documents"),
        api("/privacy/audit"),
      ]);
      setMe(m);
      setSocial(s);
      setDocs(d);
      setLog(l);
    } catch (e) {
      if (e.message.includes("log in")) onOut();
      else setErr(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const act =
    (f) =>
    async (...a) => {
      setErr("");
      try {
        await f(...a);
        await load();
      } catch (e) {
        setErr(e.message);
      }
    };

  const connectGoogle = act(async () => {
    if (
      !confirm(
        "Connect Google? We store a login token and your account email. We never post or read your data. You can disconnect any time.",
      )
    )
      return;
    const { url } = await api("/social/google/connect", { method: "POST" });
    location.href = url;
  });
  const disconnect = act((p) => api("/social/" + p, { method: "DELETE" }));
  const upload = act(async (e) => {
    e.preventDefault();
    await api("/documents", { method: "POST", body: new FormData(e.target) });
    e.target.reset();
  });
  const view = act(async (id) => {
    await api(`/documents/${id}/otp`, { method: "POST" });
    const code = prompt("Enter the OTP sent to your phone");
    if (!code) return;
    const blob = await api(`/documents/${id}/view`, {
      method: "POST",
      body: { code },
      raw: true,
    });
    window.open(URL.createObjectURL(blob));
  });
  const remove = act((id) => api("/documents/" + id, { method: "DELETE" }));
  const wipe = act(async () => {
    if (!confirm("Delete all your data? This cannot be undone.")) return;
    await api("/privacy/data", { method: "DELETE" });
    onOut();
  });

  if (!me)
    return (
      <main>
        <p>Loading…</p>
        {err && <p className="err">{err}</p>}
      </main>
    );
  const google = social.find((s) => s.provider === "google");

  return (
    <main>
      <div className="card row">
        <div>
          <b>{me.phone}</b> <small className="ok">Verified</small>
          <input
            defaultValue={me.name || ""}
            placeholder="Your name"
            onBlur={(e) =>
              api("/me", { method: "PATCH", body: { name: e.target.value } })
            }
          />
        </div>
        <button className="ghost" onClick={onOut}>
          Log out
        </button>
      </div>
      {err && <p className="err">{err}</p>}

      <h2>Social accounts</h2>
      <div className="card row">
        <div>
          <b>Google</b>
          <small>{google ? google.label : "Not connected"}</small>
        </div>
        {google ? (
          <button className="ghost" onClick={() => disconnect("google")}>
            Disconnect
          </button>
        ) : (
          <button onClick={connectGoogle}>Connect</button>
        )}
      </div>
      <p>
        <small>
          Facebook, Instagram, LinkedIn and X use the same flow once you add
          their keys.
        </small>
      </p>

      <h2>Government IDs</h2>
      {docs.length === 0 && <p>No documents yet. Add one below.</p>}
      {docs.map((d) => (
        <div className="card row" key={d.id}>
          <div>
            <b>{d.doc_type}</b>
            <small>{d.number_masked}</small>
          </div>
          <div className="row">
            <button className="ghost" onClick={() => view(d.id)}>
              View
            </button>
            <button className="ghost" onClick={() => remove(d.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
      <form className="card" onSubmit={upload}>
        <select name="type">
          {[
            "aadhaar",
            "pan",
            "driving_licence",
            "passport",
            "voter_id",
            "other",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          name="number"
          placeholder="ID number (only the last 4 digits are kept)"
        />
        <input name="file" type="file" accept=".jpg,.jpeg,.png,.pdf" required />
        <button>Upload document</button>
      </form>

      <h2>Privacy</h2>
      <div className="card">
        <b>Activity log</b>
        {log.map((l, i) => (
          <div className="log" key={i}>
            {l.action} · {new Date(l.created_at).toLocaleString()}
          </div>
        ))}
        <button className="danger" onClick={wipe}>
          Delete all my data
        </button>
      </div>
    </main>
  );
}
```

Replace `client/src/index.css`

```css
:root {
  --bg: #eef2f1;
  --card: #fff;
  --ink: #12262b;
  --mute: #5d7076;
  --line: #d5dfdd;
  --acc: #0f6b62;
  --warn: #a4430c;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0e1a1c;
    --card: #16272a;
    --ink: #e6f0ee;
    --mute: #93a9a6;
    --line: #27403f;
    --acc: #3fbfae;
    --warn: #f0a068;
  }
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font:
    16px/1.45 system-ui,
    sans-serif;
}
main {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px 48px;
}
h1 {
  margin: 0 0 4px;
}
h2 {
  font-size: 18px;
  margin: 26px 0 10px;
}
p {
  color: var(--mute);
}
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
b,
small {
  display: block;
}
small {
  color: var(--mute);
}
.ok {
  display: inline;
  color: var(--acc);
}
input,
select {
  width: 100%;
  padding: 12px;
  margin: 6px 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
}
button {
  font: inherit;
  font-weight: 600;
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  background: var(--acc);
  color: #fff;
}
button.ghost {
  background: none;
  border: 1px solid var(--line);
  color: var(--ink);
}
button.danger {
  background: none;
  border: 1px solid var(--warn);
  color: var(--warn);
  width: 100%;
  margin-top: 12px;
}
.err {
  color: var(--warn);
}
.log {
  font-size: 14px;
  color: var(--mute);
  padding: 5px 0;
  border-bottom: 1px solid var(--line);
}
```

Run it:

```bash
npm run dev
```

Open <http://localhost:5173>.

## Step 7: Test the flow

1. Enter `+919876543210` and click **Send OTP**.
2. Read the 6-digit code in the **server terminal** (`[DEV OTP] ...`).
3. Enter it. You land on the dashboard.
4. Upload a PDF or image. The file is stored encrypted in `server/uploads/`.
5. Click **View**, read the new OTP from the server terminal, enter it.
6. Check the activity log, then try **Delete all my data**.

## Step 8: Before real users

- **Real OTP:** `npm install twilio` in `server`, then replace the bodies of `sendOtp` and `checkOtp` with Twilio Verify calls (`verify.v2.services(SID).verifications.create(...)` and `.verificationChecks.create(...)`). Delete the `otps` table.
- **Google login:** in Google Cloud Console, create an OAuth client and add `http://localhost:4000/social/google/callback` as a redirect URI. Put the keys in `.env`.
- **Other providers:** copy the Google block with each provider's URLs. X needs PKCE.
- **DigiLocker:** needs partner onboarding at digilocker.gov.in before you get API keys.
- **Harden:** refresh tokens in httpOnly cookies, HTTPS, a KMS-wrapped key per file, S3 or similar storage, antivirus scan on uploads. See the security checklist in `MyIdentityHub-spec.md`.
