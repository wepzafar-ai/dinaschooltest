const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  ONE_HOUR_MS,
  hashPassword,
  nowIso,
  uid,
  readDb,
  writeDb,
  publicTest,
  publicQuestion,
  scoreAttempt,
  getAttemptStatus,
  finishExpiredAttempts
} = require("./store");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "127.0.0.1";
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";
const tokens = new Map();

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  });
  res.end(JSON.stringify(data));
}

function notFound(res) {
  send(res, 404, { message: "Topilmadi" });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function auth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return tokens.get(token) || null;
}

function requireRole(req, res, role) {
  const session = auth(req);
  if (!session || session.role !== role) {
    send(res, 401, { message: "Ruxsat yo'q" });
    return null;
  }
  return session;
}

function newToken(payload) {
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, payload);
  return token;
}

function attemptView(db, attempt) {
  const student = db.students.find((item) => item.id === attempt.studentId);
  const test = db.tests.find((item) => item.id === attempt.testId);
  return {
    id: attempt.id,
    studentId: attempt.studentId,
    studentName: student?.fullName || "-",
    group: student?.group || "-",
    testId: attempt.testId,
    testTitle: test?.title || "-",
    status: getAttemptStatus(attempt),
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    finishedAt: attempt.finishedAt || null,
    correct: attempt.correct ?? null,
    wrong: attempt.wrong ?? null,
    percent: attempt.percent ?? null,
    answeredCount: Object.keys(attempt.answers || {}).length,
    totalQuestions: test?.questions.length || 0
  };
}

function studentWithAttempts(db, student) {
  const attempts = db.attempts.filter((attempt) => attempt.studentId === student.id).map((attempt) => attemptView(db, attempt));
  return {
    id: student.id,
    fullName: student.fullName,
    group: student.group,
    login: student.login,
    createdAt: student.createdAt,
    attempts
  };
}

async function handleLogin(req, res) {
  const body = await parseBody(req);
  const role = body.role;
  const login = String(body.login || "").trim();
  const password = String(body.password || "");

  if (role === "admin") {
    if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
      return send(res, 401, { message: "Admin login yoki parol noto'g'ri" });
    }
    const token = newToken({ role: "admin", id: "admin", name: "Admin" });
    return send(res, 200, { token, user: { role: "admin", name: "Admin" } });
  }

  if (role === "student") {
    const db = readDb();
    finishExpiredAttempts(db);
    const student = db.students.find((item) => item.login.toLowerCase() === login.toLowerCase());
    if (!student || student.passwordHash !== hashPassword(password)) {
      return send(res, 401, { message: "O'quvchi login yoki parol noto'g'ri" });
    }
    const token = newToken({ role: "student", id: student.id, name: student.fullName });
    return send(res, 200, {
      token,
      user: { role: "student", id: student.id, name: student.fullName, group: student.group }
    });
  }

  return send(res, 400, { message: "Rol noto'g'ri" });
}

function handleMe(req, res) {
  const session = auth(req);
  if (!session) return send(res, 401, { message: "Token topilmadi" });
  send(res, 200, { user: session });
}

function handleStudentTests(req, res) {
  const session = requireRole(req, res, "student");
  if (!session) return;
  const db = readDb();
  finishExpiredAttempts(db);

  const tests = db.tests.map((test) => {
    const attempt = db.attempts.find((item) => item.studentId === session.id && item.testId === test.id);
    return {
      ...publicTest(test),
      status: getAttemptStatus(attempt),
      attemptId: attempt?.id || null,
      result: attempt?.status === "finished" ? { correct: attempt.correct, wrong: attempt.wrong, percent: attempt.percent } : null
    };
  });
  send(res, 200, { tests });
}

function handleStartTest(req, res, testId) {
  const session = requireRole(req, res, "student");
  if (!session) return;
  const db = readDb();
  finishExpiredAttempts(db);
  const test = db.tests.find((item) => item.id === testId);
  if (!test) return notFound(res);

  let attempt = db.attempts.find((item) => item.studentId === session.id && item.testId === testId);
  if (attempt && attempt.status === "finished") {
    return send(res, 400, { message: "Bu test yakunlangan" });
  }

  if (!attempt) {
    const startedAt = new Date();
    attempt = {
      id: uid("att"),
      studentId: session.id,
      testId,
      answers: {},
      status: "in_progress",
      startedAt: startedAt.toISOString(),
      expiresAt: new Date(startedAt.getTime() + ONE_HOUR_MS).toISOString(),
      createdAt: nowIso()
    };
    db.attempts.push(attempt);
    writeDb(db);
  }

  send(res, 200, {
    attempt: attemptView(db, attempt),
    test: {
      ...publicTest(test),
      questions: test.questions.map(publicQuestion)
    },
    answers: attempt.answers || {},
    serverTime: nowIso()
  });
}

async function handleSaveAnswer(req, res, attemptId) {
  const session = requireRole(req, res, "student");
  if (!session) return;
  const body = await parseBody(req);
  const db = readDb();
  finishExpiredAttempts(db);
  const attempt = db.attempts.find((item) => item.id === attemptId && item.studentId === session.id);
  if (!attempt) return notFound(res);
  if (attempt.status === "finished" || Date.now() > new Date(attempt.expiresAt).getTime()) {
    return send(res, 400, { message: "Test vaqti tugagan" });
  }
  const test = db.tests.find((item) => item.id === attempt.testId);
  const question = test.questions.find((item) => item.id === body.questionId);
  if (!question) return send(res, 400, { message: "Savol topilmadi" });
  const selected = Number(body.selected);
  if (!Number.isInteger(selected) || selected < 0 || selected >= question.options.length) {
    return send(res, 400, { message: "Javob noto'g'ri" });
  }
  attempt.answers[question.id] = selected;
  attempt.updatedAt = nowIso();
  writeDb(db);
  send(res, 200, { attempt: attemptView(db, attempt), answers: attempt.answers });
}

async function handleSubmitTest(req, res, attemptId) {
  const session = requireRole(req, res, "student");
  if (!session) return;
  const body = await parseBody(req);
  const db = readDb();
  const attempt = db.attempts.find((item) => item.id === attemptId && item.studentId === session.id);
  if (!attempt) return notFound(res);
  if (attempt.status === "finished") {
    return send(res, 200, { attempt: attemptView(db, attempt) });
  }
  const test = db.tests.find((item) => item.id === attempt.testId);
  attempt.answers = { ...(attempt.answers || {}), ...(body.answers || {}) };
  const result = scoreAttempt(test, attempt.answers);
  attempt.status = "finished";
  attempt.finishedAt = nowIso();
  attempt.correct = result.correct;
  attempt.wrong = result.wrong;
  attempt.percent = result.percent;
  attempt.detail = result.detail;
  writeDb(db);
  send(res, 200, { attempt: attemptView(db, attempt), result });
}

function handleStudentResults(req, res) {
  const session = requireRole(req, res, "student");
  if (!session) return;
  const db = readDb();
  finishExpiredAttempts(db);
  const attempts = db.attempts.filter((item) => item.studentId === session.id).map((item) => attemptView(db, item));
  send(res, 200, { attempts });
}

function handleAdminDashboard(req, res, url) {
  const session = requireRole(req, res, "admin");
  if (!session) return;
  const db = readDb();
  finishExpiredAttempts(db);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const status = url.searchParams.get("status") || "all";
  const testId = url.searchParams.get("testId") || "all";

  const attempts = db.attempts.map((attempt) => attemptView(db, attempt)).filter((attempt) => {
    const matchesSearch =
      !q ||
      attempt.studentName.toLowerCase().includes(q) ||
      attempt.group.toLowerCase().includes(q) ||
      attempt.testTitle.toLowerCase().includes(q);
    const matchesStatus = status === "all" || attempt.status === status;
    const matchesTest = testId === "all" || attempt.testId === testId;
    return matchesSearch && matchesStatus && matchesTest;
  });

  const finished = db.attempts.filter((attempt) => getAttemptStatus(attempt) === "finished");
  const inProgress = db.attempts.filter((attempt) => getAttemptStatus(attempt) === "in_progress");
  const notStarted = db.students.length * db.tests.length - db.attempts.length;

  send(res, 200, {
    stats: {
      studentCount: db.students.length,
      testCount: db.tests.length,
      finishedCount: finished.length,
      inProgressCount: inProgress.length,
      notStartedCount: Math.max(notStarted, 0),
      averagePercent: finished.length
        ? Math.round((finished.reduce((sum, item) => sum + (item.percent || 0), 0) / finished.length) * 100) / 100
        : 0
    },
    tests: db.tests.map(publicTest),
    attempts,
    students: db.students.map((student) => studentWithAttempts(db, student))
  });
}

async function handleCreateStudent(req, res) {
  const session = requireRole(req, res, "admin");
  if (!session) return;
  const body = await parseBody(req);
  const fullName = String(body.fullName || "").trim();
  const group = String(body.group || "").trim() || "DinaSchool";
  const login = String(body.login || "").trim();
  const password = String(body.password || "").trim();
  if (fullName.length < 3 || login.length < 3 || password.length < 4) {
    return send(res, 400, { message: "Ism, login yoki parol juda qisqa" });
  }
  const db = readDb();
  if (db.students.some((student) => student.login.toLowerCase() === login.toLowerCase())) {
    return send(res, 400, { message: "Bu login band" });
  }
  const student = {
    id: uid("stu"),
    fullName,
    group,
    login,
    passwordHash: hashPassword(password),
    createdAt: nowIso()
  };
  db.students.push(student);
  writeDb(db);
  send(res, 201, { student: studentWithAttempts(db, student) });
}

function router(req, res) {
  if (req.method === "OPTIONS") {
    return send(res, 204, {});
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  Promise.resolve()
    .then(() => {
      if (req.method === "POST" && path === "/api/login") return handleLogin(req, res);
      if (req.method === "GET" && path === "/api/me") return handleMe(req, res);
      if (req.method === "GET" && path === "/api/student/tests") return handleStudentTests(req, res);
      if (req.method === "GET" && path === "/api/student/results") return handleStudentResults(req, res);
      if (req.method === "POST" && /^\/api\/student\/tests\/[^/]+\/start$/.test(path)) {
        return handleStartTest(req, res, path.split("/")[4]);
      }
      if (req.method === "PUT" && /^\/api\/student\/attempts\/[^/]+\/answer$/.test(path)) {
        return handleSaveAnswer(req, res, path.split("/")[4]);
      }
      if (req.method === "POST" && /^\/api\/student\/attempts\/[^/]+\/submit$/.test(path)) {
        return handleSubmitTest(req, res, path.split("/")[4]);
      }
      if (req.method === "GET" && path === "/api/admin/dashboard") return handleAdminDashboard(req, res, url);
      if (req.method === "POST" && path === "/api/admin/students") return handleCreateStudent(req, res);
      return notFound(res);
    })
    .catch((error) => {
      console.error(error);
      send(res, 500, { message: "Server xatosi", error: error.message });
    });
}

const server = http.createServer(router);

server.listen(PORT, HOST, () => {
  console.log(`DinaSchool backend: http://${HOST}:${PORT}`);
  console.log(`Admin login: ${ADMIN_LOGIN}`);
  console.log("Admin password: set ADMIN_PASSWORD in .env or use default admin12345");
});
