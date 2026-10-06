import { useEffect, useMemo, useState } from "react";
import { clearToken, downloadCsv, getStoredUser, request, setStoredUser, setToken } from "./api";

function formatMoney(value) {
  return new Intl.NumberFormat("uz-UZ").format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusLabel(status) {
  const labels = {
    finished: "Ishlab bo'lgan",
    in_progress: "Ishlayapti",
    expired: "Vaqti tugagan",
    not_started: "Ishlamagan",
    all: "Hammasi"
  };
  return labels[status] || status;
}

function Login({ onLogin }) {
  const [role, setRole] = useState("student");
  const [login, setLogin] = useState(role === "admin" ? "admin" : "ali");
  const [password, setPassword] = useState(role === "admin" ? "admin12345" : "123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function changeRole(nextRole) {
    setRole(nextRole);
    setLogin(nextRole === "admin" ? "admin" : "ali");
    setPassword(nextRole === "admin" ? "admin12345" : "123456");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await request("/login", {
        method: "POST",
        body: JSON.stringify({ role, login, password })
      });
      setToken(data.token);
      setStoredUser(data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="brand-mark">DS</div>
        <p className="eyebrow">Online test platforma</p>
        <h1>DinaSchool</h1>
        <p className="brand-copy">
          HTML CSS va Office testlari uchun zamonaviy nazorat paneli. Admin hamma natijani kuzatadi, o'quvchi esa 1 soat ichida testni ishlaydi.
        </p>
        <div className="brand-stats">
          <span>3 ta yo'nalish</span>
          <span>1 soat vaqt</span>
          <span>Admin filter</span>
        </div>
      </section>

      <section className="login-card">
        <div className="role-tabs">
          <button className={role === "student" ? "active" : ""} onClick={() => changeRole("student")} type="button">
            O'quvchi
          </button>
          <button className={role === "admin" ? "active" : ""} onClick={() => changeRole("admin")} type="button">
            Admin
          </button>
        </div>

        <form onSubmit={submit} className="form-stack">
          <label>
            Login
            <input value={login} onChange={(event) => setLogin(event.target.value)} placeholder="login" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="password" />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary-btn" disabled={loading}>
            {loading ? "Tekshirilmoqda..." : "Kirish"}
          </button>
        </form>

        <div className="hint-box">
          <b>Test uchun:</b> admin/admin12345 yoki ali/123456
        </div>
      </section>
    </main>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="mini-logo">DS</div>
        <div>
          <strong>DinaSchool</strong>
          <span>{user?.role === "admin" ? "Admin panel" : "O'quvchi panel"}</span>
        </div>
      </div>
      <button className="ghost-btn" onClick={onLogout}>
        Chiqish
      </button>
    </header>
  );
}

function StudentDashboard({ user }) {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [testsData, resultsData] = await Promise.all([request("/student/tests"), request("/student/results")]);
      setTests(testsData.tests);
      setResults(resultsData.attempts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function startTest(testId) {
    try {
      const data = await request(`/student/tests/${testId}/start`, { method: "POST" });
      setActiveTest(data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (activeTest) {
    return (
      <TestRunner
        data={activeTest}
        onBack={() => {
          setActiveTest(null);
          load();
        }}
      />
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Xush kelibsiz</p>
          <h1>{user?.name}</h1>
          <p>Testni tanlang. Har bir test uchun 1 soat vaqt beriladi.</p>
        </div>
        <div className="hero-card">
          <span>Vaqt</span>
          <strong>60 daqiqa</strong>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}
      {loading ? <div className="loading">Yuklanmoqda...</div> : null}

      <section className="test-grid">
        {tests.map((test) => (
          <article className="test-card" key={test.id}>
            <div className="status-row">
              <span className={`status-pill ${test.status}`}>{statusLabel(test.status)}</span>
              <span>{test.questionCount} savol</span>
            </div>
            <h2>{test.title}</h2>
            <p>{test.description}</p>
            {test.result && (
              <div className="result-strip">
                <span>Natija</span>
                <b>{test.result.percent}%</b>
              </div>
            )}
            <button className="primary-btn" disabled={test.status === "finished"} onClick={() => startTest(test.id)}>
              {test.status === "in_progress" ? "Davom etish" : test.status === "finished" ? "Yakunlangan" : "Testni boshlash"}
            </button>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>Mening natijalarim</h2>
          <span>{results.length} ta urinish</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Status</th>
                <th>To'g'ri</th>
                <th>Foiz</th>
                <th>Boshlangan</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>{result.testTitle}</td>
                  <td><span className={`status-pill ${result.status}`}>{statusLabel(result.status)}</span></td>
                  <td>{result.correct ?? "-"}/{result.totalQuestions}</td>
                  <td>{result.percent ?? "-"}%</td>
                  <td>{formatDate(result.startedAt)}</td>
                </tr>
              ))}
              {!results.length && (
                <tr>
                  <td colSpan="5" className="empty-cell">Hali test ishlanmagan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function TestRunner({ data, onBack }) {
  const [answers, setAnswers] = useState(data.answers || {});
  const [attempt, setAttempt] = useState(data.attempt);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const remainingMs = Math.max(0, new Date(attempt.expiresAt).getTime() - now);
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remainingMs === 0 && attempt.status !== "finished") {
      submit();
    }
  }, [remainingMs]);

  async function selectAnswer(questionId, selected) {
    const next = { ...answers, [questionId]: selected };
    setAnswers(next);
    setSaving("Saqlanmoqda...");
    try {
      const response = await request(`/student/attempts/${attempt.id}/answer`, {
        method: "PUT",
        body: JSON.stringify({ questionId, selected })
      });
      setAttempt(response.attempt);
      setSaving("Saqlandi");
    } catch (err) {
      setError(err.message);
      setSaving("");
    }
  }

  async function submit() {
    try {
      const response = await request(`/student/attempts/${attempt.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers })
      });
      setAttempt(response.attempt);
      alert(`Test yakunlandi. Natija: ${response.attempt.percent}%`);
      onBack();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page-shell test-runner">
      <section className="runner-top">
        <div>
          <button className="ghost-btn" onClick={onBack}>Orqaga</button>
          <h1>{data.test.title}</h1>
          <p>{data.test.questionCount} ta savol. Javoblar avtomatik saqlanadi.</p>
        </div>
        <div className="timer-box">
          <span>Qolgan vaqt</span>
          <strong>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong>
          <small>{answeredCount}/{data.test.questionCount} javob</small>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}
      {saving && <div className="save-note">{saving}</div>}

      <section className="question-list">
        {data.test.questions.map((question, index) => (
          <article className="question-card" key={question.id}>
            <h3>{index + 1}. {question.question}</h3>
            <div className="option-list">
              {question.options.map((option, optionIndex) => (
                <button
                  className={Number(answers[question.id]) === optionIndex ? "option active" : "option"}
                  key={option}
                  onClick={() => selectAnswer(question.id, optionIndex)}
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                  {option}
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>

      <div className="sticky-submit">
        <span>{answeredCount}/{data.test.questionCount} ta javob belgilandi</span>
        <button className="primary-btn" onClick={submit}>Testni yakunlash</button>
      </div>
    </main>
  );
}

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [filters, setFilters] = useState({ q: "", status: "all", testId: "all" });
  const [studentForm, setStudentForm] = useState({ fullName: "", group: "", login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(nextFilters);
      const data = await request(`/admin/dashboard?${params.toString()}`);
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateFilter(name, value) {
    const next = { ...filters, [name]: value };
    setFilters(next);
    load(next);
  }

  async function createStudent(event) {
    event.preventDefault();
    try {
      await request("/admin/students", {
        method: "POST",
        body: JSON.stringify(studentForm)
      });
      setStudentForm({ fullName: "", group: "", login: "", password: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function exportCsv() {
    if (!dashboard) return;
    const rows = [
      ["O'quvchi", "Guruh", "Test", "Status", "To'g'ri", "Foiz", "Boshlangan", "Yakunlangan"],
      ...dashboard.attempts.map((attempt) => [
        attempt.studentName,
        attempt.group,
        attempt.testTitle,
        statusLabel(attempt.status),
        `${attempt.correct ?? "-"}/${attempt.totalQuestions}`,
        attempt.percent ?? "-",
        formatDate(attempt.startedAt),
        formatDate(attempt.finishedAt)
      ])
    ];
    downloadCsv("dinaschool-natijalar.csv", rows);
  }

  const tests = dashboard?.tests || [];
  const attempts = dashboard?.attempts || [];
  const students = dashboard?.students || [];

  return (
    <main className="page-shell">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Admin nazorat paneli</p>
          <h1>DinaSchool Test Monitoring</h1>
          <p>O'quvchilar, test jarayoni, yakunlangan ishlar va natijalarni bir joyda kuzating.</p>
        </div>
        <button className="primary-btn" onClick={exportCsv}>CSV eksport</button>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="stats-grid">
        <div className="stat-card">
          <span>O'quvchilar</span>
          <strong>{dashboard?.stats.studentCount ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Ishlab bo'lgan</span>
          <strong>{dashboard?.stats.finishedCount ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Ishlayapti</span>
          <strong>{dashboard?.stats.inProgressCount ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>O'rtacha foiz</span>
          <strong>{dashboard?.stats.averagePercent ?? 0}%</strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>Filter</h2>
          <span>{attempts.length} ta natija</span>
        </div>
        <div className="filter-grid">
          <input value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Ism, guruh yoki test qidirish" />
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            <option value="all">Hammasi</option>
            <option value="finished">Ishlab bo'lgan</option>
            <option value="in_progress">Ishlayapti</option>
            <option value="expired">Vaqti tugagan</option>
          </select>
          <select value={filters.testId} onChange={(event) => updateFilter("testId", event.target.value)}>
            <option value="all">Barcha testlar</option>
            {tests.map((test) => <option key={test.id} value={test.id}>{test.title}</option>)}
          </select>
        </div>

        {loading ? <div className="loading">Yuklanmoqda...</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Guruh</th>
                <th>Test</th>
                <th>Status</th>
                <th>Javob</th>
                <th>Foiz</th>
                <th>Boshlangan</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.studentName}</td>
                  <td>{attempt.group}</td>
                  <td>{attempt.testTitle}</td>
                  <td><span className={`status-pill ${attempt.status}`}>{statusLabel(attempt.status)}</span></td>
                  <td>{attempt.correct ?? "-"}/{attempt.totalQuestions}</td>
                  <td>{attempt.percent ?? "-"}%</td>
                  <td>{formatDate(attempt.startedAt)}</td>
                </tr>
              ))}
              {!attempts.length && (
                <tr>
                  <td colSpan="7" className="empty-cell">Filter bo'yicha natija yo'q.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="section-title">
            <h2>O'quvchi qo'shish</h2>
          </div>
          <form className="form-stack" onSubmit={createStudent}>
            <label>
              Ism familya
              <input value={studentForm.fullName} onChange={(event) => setStudentForm({ ...studentForm, fullName: event.target.value })} />
            </label>
            <label>
              Guruh
              <input value={studentForm.group} onChange={(event) => setStudentForm({ ...studentForm, group: event.target.value })} />
            </label>
            <label>
              Login
              <input value={studentForm.login} onChange={(event) => setStudentForm({ ...studentForm, login: event.target.value })} />
            </label>
            <label>
              Password
              <input value={studentForm.password} onChange={(event) => setStudentForm({ ...studentForm, password: event.target.value })} />
            </label>
            <button className="primary-btn">Qo'shish</button>
          </form>
        </div>

        <div className="panel">
          <div className="section-title">
            <h2>Kimlar bor</h2>
            <span>{students.length} ta</span>
          </div>
          <div className="student-list">
            {students.map((student) => (
              <details key={student.id}>
                <summary>
                  <span>{student.fullName}</span>
                  <small>{student.group} | login: {student.login}</small>
                </summary>
                <div className="attempt-mini-list">
                  {tests.map((test) => {
                    const attempt = student.attempts.find((item) => item.testId === test.id);
                    return (
                      <div key={test.id}>
                        <span>{test.title}</span>
                        <b className={`status-pill ${attempt?.status || "not_started"}`}>
                          {statusLabel(attempt?.status || "not_started")}
                        </b>
                        <em>{attempt?.percent ?? "-"}%</em>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());

  function logout() {
    clearToken();
    setUser(null);
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <>
      <Header user={user} onLogout={logout} />
      {user.role === "admin" ? <AdminDashboard /> : <StudentDashboard user={user} />}
    </>
  );
}
