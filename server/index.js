const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const USERS_FILE = path.join(__dirname, "users.json");

function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

let users = loadUsers();
if (!users.find((u) => u.email === "admin@example.com")) {
  users.push({
    id: "admin",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  });
  saveUsers(users);
}

// Simple token payload encoder/decoder (not secure, for demo only)
function encodeToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function decodeToken(token) {
  try {
    const raw = Buffer.from(token, "base64").toString("utf8");
    const payload = JSON.parse(raw);
    return payload;
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice(7);
  const payload = decodeToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });
  if (payload.exp && Date.now() > payload.exp) {
    return res.status(401).json({ error: "Token expired" });
  }
  req.user = payload;
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    const payload = req.user;
    if (!payload || !payload.role || !roles.includes(payload.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// Auth routes
app.post("/auth/sign-up", (req, res) => {
  const { email, admissionNumber, password } = req.body;
  if (!email || !password || !admissionNumber) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }
  const newUser = {
    id: String(Date.now()),
    email,
    admissionNumber,
    password,
    role: "voter",
  };
  users.push(newUser);
  saveUsers(users);
  res
    .status(201)
    .json({
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
    });
});

app.post("/auth/sign-in", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  // token payload expires in 1 hour
  const payload = {
    email: user.email,
    role: user.role,
    id: user.id,
    exp: Date.now() + 60 * 60 * 1000,
  };
  const token = encodeToken(payload);
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

app.post("/auth/sign-out", (req, res) => {
  // Stateless demo: simply respond success
  res.json({ message: "Signed out" });
});

// Protected admin routes
app.get(
  "/admin/dashboard",
  authMiddleware,
  requireRole(["admin"]),
  (req, res) => {
    res.json({ data: "Admin dashboard data" });
  },
);

// Protected voter routes
app.get(
  "/voter/dashboard",
  authMiddleware,
  requireRole(["voter"]),
  (req, res) => {
    res.json({ data: "Voter dashboard data" });
  },
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
