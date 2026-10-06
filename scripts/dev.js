const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const commandRunner = isWindows ? process.env.ComSpec || "cmd.exe" : "npm";

function npmArgs(args) {
  if (!isWindows) return args;
  return ["/d", "/s", "/c", `npm ${args.join(" ")}`];
}

function ensureEnvFile(cwd) {
  const envFile = path.join(cwd, ".env");
  const envExample = path.join(cwd, ".env.example");
  if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
  }
}

function freeDevPorts() {
  console.log("Eski 5000/5173/5174 serverlar yopilmoqda...");
  try {
    if (isWindows) {
      execSync(
        "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Get-NetTCPConnection -LocalPort 5000,5173,5174 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }\"",
        { stdio: "ignore" }
      );
    } else {
      execSync(
        "for port in 5000 5173 5174; do ids=$(lsof -ti tcp:$port 2>/dev/null || true); if [ -n \"$ids\" ]; then kill -9 $ids 2>/dev/null || true; fi; done",
        { shell: "/bin/sh", stdio: "ignore" }
      );
    }
  } catch (error) {
    console.log("Eski serverlarni yopish o'tkazib yuborildi.");
  }
}

function run(command, args, cwd, name) {
  const child = spawn(command, args, {
    cwd,
    shell: false,
    stdio: "inherit"
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.log(`${name} to'xtadi. Exit code: ${code}`);
    }
  });

  return child;
}

async function install(cwd, name) {
  console.log(`${name} dependencies tekshirilmoqda...`);
  await new Promise((resolve, reject) => {
    const child = spawn(commandRunner, npmArgs(["install"]), { cwd, shell: false, stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${name} npm install xato`))));
  });
}

async function main() {
  const backend = path.join(root, "backend");
  const frontend = path.join(root, "frontend");

  ensureEnvFile(backend);
  ensureEnvFile(frontend);

  await install(backend, "Backend");
  await install(frontend, "Frontend");
  freeDevPorts();

  console.log("");
  console.log("DinaSchool ishga tushmoqda...");
  console.log("Frontend: http://localhost:5173");
  console.log("Backend:  http://localhost:5000");
  console.log("");

  const backendProcess = run(commandRunner, npmArgs(["run", "dev"]), backend, "Backend");
  const frontendProcess = run(commandRunner, npmArgs(["run", "dev"]), frontend, "Frontend");

  process.on("SIGINT", () => {
    backendProcess.kill("SIGINT");
    frontendProcess.kill("SIGINT");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
