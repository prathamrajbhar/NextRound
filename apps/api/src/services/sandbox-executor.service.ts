import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { env } from '../lib/env';





















export interface SandboxTestCase {
  name: string;
  args: unknown[];
  expected: unknown;
}

export interface SandboxTestResult {
  name: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  actual?: unknown;
  error?: string;
  timeMs: number;
}

export type SandboxStatus =
  | 'queued'
  | 'running'
  | 'passed'
  | 'failed'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'memory_limit'
  | 'cancelled';

export interface SandboxExecutionResult {
  status: SandboxStatus;
  passRate: number; 
  passRateRatio: number; 
  results: SandboxTestResult[];
  executionTimeMs: number;
  memoryKb?: number;
  logs: string[];
  errorMessage?: string;
}

export interface SandboxExecuteOptions {
  code: string;
  language: string;
  entryPoint: string;
  testCases: SandboxTestCase[];
}

const RUNNER_VERSION = '3.0.0-isolated-sandbox';










const CPU_LIMIT_SECONDS = 4;
const MEMORY_LIMIT_KB = 262144; 
const PROC_LIMIT = 1024;
const FILE_SIZE_BLOCKS = 2048; 
const OPEN_FILES_LIMIT = 64;
const PROCESS_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_BYTES = 1_048_576; 


const SANDBOX_ENV: NodeJS.ProcessEnv = {
  PATH: env('PATH'),
  LANG: 'C.UTF-8',
  HOME: os.tmpdir(),
  TMPDIR: os.tmpdir(),
};

const NUMERIC_LANG_ALIASES: Record<string, string> = {
  py: 'python',
  python3: 'python',
  js: 'javascript',
  ts: 'typescript',
  'c++': 'cpp',
};

export function normalizeLanguage(language: string): string {
  const lang = (language || 'python').toLowerCase();
  return NUMERIC_LANG_ALIASES[lang] || lang;
}


export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(canonicalize).join(',');
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value);
    return String(Math.round(value * 1e6) / 1e6);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value;
  return String(value);
}


export function outputsEqual(actual: unknown, expected: unknown): boolean {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) < 1e-6;
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return (
      actual.length === expected.length &&
      actual.every((a, i) => outputsEqual(a, expected[i]))
    );
  }
  if (typeof actual === 'string' && typeof expected === 'string') {
    return actual.trim() === expected.trim();
  }
  return String(actual).trim() === String(expected).trim();
}





interface SpawnOutcome {
  code: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  stdoutExceeded: boolean;
  signal: NodeJS.Signals | null;
  memoryKb?: number;
}

interface SpawnLimits {
  cpuSeconds?: number;
  memoryKb?: number;
  fileSizeBlocks?: number;
  procLimit?: number;
  timeoutMs?: number;
}

function spawnWithLimits(
  command: string,
  args: string[],
  inputJson: string,
  extraEnv: NodeJS.ProcessEnv = {},
  limits: SpawnLimits = {}
): Promise<SpawnOutcome> {
  return new Promise((resolve) => {
    
    
    
    
    
    
    
    const ulimitCmd = [
      `ulimit -t ${limits.cpuSeconds ?? CPU_LIMIT_SECONDS}`,
      `ulimit -v ${limits.memoryKb ?? MEMORY_LIMIT_KB}`,
      `ulimit -u ${limits.procLimit ?? PROC_LIMIT}`,
      `ulimit -f ${limits.fileSizeBlocks ?? FILE_SIZE_BLOCKS}`,
      `ulimit -n ${OPEN_FILES_LIMIT}`,
      'exec "$@"',
    ].join('; ');

    const child = spawn('/bin/bash', ['-c', ulimitCmd, 'sandbox-runner', command, ...args], {
      env: { ...SANDBOX_ENV, ...extraEnv },
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let stdoutExceeded = false;
    let maxRssKb = 0;

    const memPoll = setInterval(() => {
      try {
        const status = fs.readFileSync(`/proc/${child.pid}/status`, 'utf-8');
        const match = status.match(/VmRSS:\s+(\d+)\s+kB/);
        if (match) {
          maxRssKb = Math.max(maxRssKb, parseInt(match[1], 10));
        }
      } catch {
        
      }
    }, 100);

    child.stdin.on('error', () => {
      
    });
    child.stdin.write(inputJson);
    child.stdin.end();

    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length + chunk.length > MAX_OUTPUT_BYTES) {
        stdoutExceeded = true;
        child.kill('SIGKILL');
        return;
      }
      stdout += chunk.toString('utf-8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length + chunk.length > MAX_OUTPUT_BYTES) {
        child.kill('SIGKILL');
        return;
      }
      stderr += chunk.toString('utf-8');
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-(child.pid as number), 'SIGKILL');
      } catch {
        
      }
    }, limits.timeoutMs ?? PROCESS_TIMEOUT_MS);

    child.on('error', (err) => {
      clearInterval(memPoll);
      clearTimeout(timer);
      resolve({
        code: null,
        timedOut: false,
        stdout: '',
        stderr: `spawn error: ${err.message}`,
        stdoutExceeded: false,
        signal: null,
        memoryKb: maxRssKb || undefined,
      });
    });

    child.on('close', (code, signal) => {
      clearInterval(memPoll);
      clearTimeout(timer);
      resolve({
        code,
        timedOut,
        stdout,
        stderr,
        stdoutExceeded,
        signal: signal || null,
        memoryKb: maxRssKb || undefined,
      });
    });
  });
}

function parseRunnerOutput(stdout: string): { ok: boolean; results?: any[]; error?: string } | null {
  const marker = '__NR__';
  const idx = stdout.indexOf(marker);
  if (idx === -1) return null;
  try {
    return JSON.parse(stdout.slice(idx + marker.length).trim().split('\n')[0]);
  } catch {
    return null;
  }
}





const PYTHON_RUNNER = `
import ast, json, sys, time

def emit(obj):
    sys.stdout.write("__NR__" + json.dumps(obj))
    sys.stdout.flush()
    sys.exit(0)

def blocked(violations):
    emit({"ok": False, "error": "SecurityError: blocked - " + ", ".join(violations[:5])})

FORBIDDEN_IMPORTS = {
    "os", "subprocess", "socket", "urllib", "requests", "httpx", "sys",
    "pathlib", "importlib", "ctypes", "shutil", "signal", "multiprocessing",
    "threading", "http", "ftplib", "smtplib", "telnetlib", "xmlrpc", "cgi",
    "wsgiref", "pty", "resource", "pickle", "marshal", "runpy", "site",
    "asyncio", "socketserver", "zipfile", "tarfile", "shlex", "platform",
    "gc", "io", "code", "codeop", "contextlib", "functools", "inspect",
}
FORBIDDEN_CALLS = {"eval", "exec", "compile", "open", "__import__", "input", "breakpoint"}

payload = json.load(sys.stdin)
code = payload["code"]
entry = payload["entryPoint"]
tests = payload["testCases"]

try:
    tree = ast.parse(code)
except SyntaxError as e:
    emit({"ok": False, "error": "SyntaxError: " + str(e)})

violations = []
for node in ast.walk(tree):
    if isinstance(node, ast.Import):
        for a in node.names:
            base = a.name.split(".")[0]
            if base in FORBIDDEN_IMPORTS:
                violations.append("import " + a.name)
    elif isinstance(node, ast.ImportFrom):
        base = (node.module or "").split(".")[0]
        if base in FORBIDDEN_IMPORTS or node.module == "builtins":
            violations.append("from " + (node.module or "") + " import ...")
    elif isinstance(node, ast.Call):
        f = node.func
        if isinstance(f, ast.Name) and f.id in FORBIDDEN_CALLS:
            violations.append(f.id + "()")
        elif isinstance(f, ast.Attribute) and f.attr in ("open",):
            violations.append(".open()")
if violations:
    blocked(violations)

scope = {}
try:
    exec(code, scope)
except Exception as e:
    emit({"ok": False, "error": type(e).__name__ + ": " + str(e)})

fn = scope.get(entry)
if not callable(fn):
    for val in scope.values():
        if callable(val) and not getattr(val, "__name__", "").startswith("_"):
            fn = val
            break
if not callable(fn):
    emit({"ok": False, "error": "Entry point '" + entry + "' not found in candidate code."})

results = []
for t in tests:
    start = time.time()
    try:
        out = fn(*t["args"])
        results.append({"name": t["name"], "status": "run", "actual": out,
                        "timeMs": round((time.time() - start) * 1000, 2)})
    except Exception as e:
        results.append({"name": t["name"], "status": "error", "actual": None,
                        "error": type(e).__name__ + ": " + str(e),
                        "timeMs": round((time.time() - start) * 1000, 2)})

print("__NR__" + json.dumps({"ok": True, "results": results}))
`;





const NODE_RUNNER = `
let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  const print = (obj) => { process.stdout.write('__NR__' + JSON.stringify(obj)); };
  try {
    const payload = JSON.parse(raw);
    const code = payload.code;
    const entry = payload.entryPoint;
    const tests = payload.testCases;

    const blockedMods = ['http','https','net','dns','tls','child_process','fs','os','path',
      'worker_threads','cluster','dgram','vm','v8','async_hooks','module','process'];
    const safeRequire = (id) => {
      const base = String(id).split('/')[0].replace(/^\\./, '');
      if (blockedMods.includes(base) || base === 'node:process') {
        throw new Error('SecurityError: module "' + id + '" is blocked');
      }
      return require(id);
    };
    globalThis.fetch = () => { throw new Error('SecurityError: fetch is disabled'); };
    globalThis.XMLHttpRequest = undefined;
    globalThis.WebSocket = undefined;
    globalThis.process = { env: {} };

    const stripTypes = (src) => src
      .replace(/((?:const|let|var)\\s+[a-zA-Z0-9_]+)\\s*:\\s*[a-zA-Z0-9_<>\\[\\]\\s,|&{}]+(?=\\s*=)/g, '$1')
      .replace(/([a-zA-Z0-9_]+)\\s*:\\s*[a-zA-Z0-9_<>\\[\\]\\s,|&{}]+(?=[,\\)])/g, '$1')
      .replace(/\\)\\s*:\\s*[a-zA-Z0-9_<>\\[\\]\\s,|&{}]+(?=\\s*\\{)/g, ')')
      .replace(/\\s+as\\s+[a-zA-Z0-9_<>\\[\\]]+/g, '');

    const cleaned = stripTypes(code);
    const module = { exports: {} };
    const factory = new Function('exports', 'module', 'require',
      cleaned + '\\nreturn typeof ' + entry + ' !== "undefined" ? ' + entry +
      ' : (module.exports.' + entry + ' || module.exports);');
    const fn = factory(module.exports, module, safeRequire);

    if (typeof fn !== 'function') {
      print({ ok: false, error: "Entry point '" + entry + "' not found in candidate code." });
      return;
    }

    const results = tests.map((t) => {
      const start = Date.now();
      try {
        const out = fn.apply(null, t.args);
        return { name: t.name, status: 'run', actual: out, timeMs: Date.now() - start };
      } catch (e) {
        return { name: t.name, status: 'error', actual: null,
                 error: (e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : String(e)),
                 timeMs: Date.now() - start };
      }
    });
    print({ ok: true, results });
  } catch (e) {
    print({ ok: false, error: (e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : String(e)) });
  }
});
`;





function cppLiteral(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null || value === undefined) return '0';
  if (Array.isArray(value)) {
    if (value.length === 0) return '{}';
    if (value.every((x) => typeof x === 'number')) {
      return `std::vector<int>{${value.map(cppLiteral).join(',')}}`;
    }
    if (value.every((x) => typeof x === 'boolean')) {
      return `std::vector<bool>{${value.map(cppLiteral).join(',')}}`;
    }
    if (value.every((x) => typeof x === 'string')) {
      return `std::vector<std::string>{${value.map(cppLiteral).join(',')}}`;
    }
    if (value.every((x) => Array.isArray(x))) {
      const inner = value.map(
        (arr) => `{${(arr as unknown[]).map(cppLiteral).join(',')}}`
      );
      return `std::vector<std::vector<int>>{${inner.join(',')}}`;
    }
    return `std::vector<double>{${value.map(cppLiteral).join(',')}}`;
  }
  return '0';
}

const CPP_CANON_HELPERS = `
template <class T> std::string canon(const T& v);
template <> std::string canon<int>(const int& v) { return std::to_string(v); }
template <> std::string canon<long long>(const long long& v) { return std::to_string(v); }
template <> std::string canon<double>(const double& v) {
    double r = std::round(v * 1e6) / 1e6;
    if (r == (long long)r) return std::to_string((long long)r);
    std::ostringstream oss; oss << r; return oss.str();
}
template <> std::string canon<bool>(const bool& v) { return v ? "true" : "false"; }
template <> std::string canon<std::string>(const std::string& v) { return v; }
template <class T> std::string canon(const std::vector<T>& v) {
    std::ostringstream oss;
    for (size_t i = 0; i < v.size(); i++) { if (i) oss << ","; oss << canon(v[i]); }
    return oss.str();
}
template <class T> std::string canon(const std::vector<std::vector<T>>& v) {
    std::ostringstream oss;
    for (size_t i = 0; i < v.size(); i++) { if (i) oss << ","; oss << canon(v[i]); }
    return oss.str();
}
`;

function buildCppHarness(code: string, entryPoint: string, testCases: SandboxTestCase[]): string {
  const testBlocks = testCases
    .map((t, i) => {
      const expectedCanon = JSON.stringify(canonicalize(t.expected));
      const name = JSON.stringify(t.name);
      
      
      const argLocals = (t.args || [])
        .map((a, j) => `auto arg${j} = ${cppLiteral(a)};`)
        .join('\n');
      const argNames = (t.args || []).map((_a, j) => `arg${j}`).join(', ');
      return `  { // test ${i}
    std::string expected = ${expectedCanon};
${argLocals}
    auto result = Solution().${entryPoint}(${argNames});
    std::string actual = canon(result);
    std::string status = (actual == expected) ? "passed" : "failed";
    lines.push_back("{\\\"name\\\":\\\"" + ${name} + "\\\",\\\"status\\\":\\\"" + status
      + "\\\",\\\"actual\\\":\\\"" + escapeJson(actual) + "\\\"}");
  }`;
    })
    .join('\n');

  return `#include <bits/stdc++.h>
using namespace std;

${code}

${CPP_CANON_HELPERS}

static std::string escapeJson(const std::string& s) {
    std::string out;
    for (char c : s) {
        if (c == '"' || c == '\\\\') { out.push_back('\\\\'); out.push_back(c); }
        else if (c == '\\n') { out += "\\\\n"; }
        else out.push_back(c);
    }
    return out;
}

int main() {
    std::vector<std::string> lines;
${testBlocks}
    std::cout << "[";
    for (size_t i = 0; i < lines.size(); i++) {
        if (i) std::cout << ",";
        std::cout << lines[i];
    }
    std::cout << "]";
    return 0;
}
`;
}





function javaLiteral(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null || value === undefined) return '0';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'new int[]{}';
    if (value.every((x) => typeof x === 'number')) {
      return `new int[]{${value.map(String).join(',')}}`;
    }
    if (value.every((x) => typeof x === 'string')) {
      return `new String[]{${value.map(x => JSON.stringify(x)).join(',')}}`;
    }
    if (value.every((x) => typeof x === 'boolean')) {
      return `new boolean[]{${value.map((x) => (x ? 'true' : 'false')).join(',')}}`;
    }
    if (value.every((x) => Array.isArray(x))) {
      const inner = value.map((arr) => `new int[]{${(arr as number[]).join(',')}}`);
      return `new int[][]{${inner.join(',')}}`;
    }
    return `new double[]{${value.map(String).join(',')}}`;
  }
  return '0';
}

const JAVA_CANON_HELPERS = `
  static String canon(Object o) {
    if (o == null) return "";
    if (o instanceof int[]) { int[] a = (int[]) o; return joinInts(a); }
    if (o instanceof long[]) { long[] a = (long[]) o; return joinLongs(a); }
    if (o instanceof double[]) { double[] a = (double[]) o; return joinDoubles(a); }
    if (o instanceof boolean[]) { boolean[] a = (boolean[]) o; return joinBools(a); }
    if (o instanceof String[]) { String[] a = (String[]) o; return joinStrs(a); }
    if (o instanceof int[][]) {
      int[][] a = (int[][]) o; java.util.List<String> parts = new java.util.ArrayList<>();
      for (int[] row : a) parts.add(joinInts(row));
      return String.join(",", parts);
    }
    if (o instanceof Double) return fmt((Double) o);
    if (o instanceof Float) return fmt(((Float) o).doubleValue());
    if (o instanceof Number) return String.valueOf(o);
    if (o instanceof String) return (String) o;
    if (o instanceof java.util.List) {
      java.util.List<?> l = (java.util.List<?>) o;
      java.util.List<String> parts = new java.util.ArrayList<>();
      for (Object e : l) parts.add(canon(e));
      return String.join(",", parts);
    }
    return String.valueOf(o);
  }
  static String fmt(double v) { return (v == Math.rint(v)) ? String.valueOf((long) v) : String.valueOf(Math.round(v * 1e6) / 1e6); }
  static String joinInts(int[] a) { java.util.List<String> p = new java.util.ArrayList<>(); for (int x : a) p.add(String.valueOf(x)); return String.join(",", p); }
  static String joinLongs(long[] a) { java.util.List<String> p = new java.util.ArrayList<>(); for (long x : a) p.add(String.valueOf(x)); return String.join(",", p); }
  static String joinDoubles(double[] a) { java.util.List<String> p = new java.util.ArrayList<>(); for (double x : a) p.add(fmt(x)); return String.join(",", p); }
  static String joinBools(boolean[] a) { java.util.List<String> p = new java.util.ArrayList<>(); for (boolean x : a) p.add(x ? "true" : "false"); return String.join(",", p); }
  static String joinStrs(String[] a) { return String.join(",", a); }
  static String escapeJson(String s) { return s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", "\\\\n"); }
`;

function buildJavaHarness(code: string, entryPoint: string, testCases: SandboxTestCase[]): { main: string; solution: string } {
  const testBlocks = testCases
    .map((t, i) => {
      const argExprs = (t.args || []).map(javaLiteral).join(', ');
      const expectedCanon = JSON.stringify(canonicalize(t.expected));
      const name = JSON.stringify(t.name);
      return `    { // test ${i}
      try {
        Object result = Solution.${entryPoint}(${argExprs});
        String actual = canon(result);
        String status = actual.equals(${expectedCanon}) ? "passed" : "failed";
        lines.add("{\\\"name\\\":\\\"" + ${name} + "\\\",\\\"status\\\":\\\"" + status
          + "\\\",\\\"actual\\\":\\\"" + escapeJson(actual) + "\\\"}");
      } catch (Throwable t) {
        lines.add("{\\\"name\\\":\\\"" + ${name} + "\\\",\\\"status\\\":\\\"error\\\",\\\"actual\\\":\\\""
          + escapeJson(String.valueOf(t)) + "\\\"}");
      }
    }`;
    })
    .join('\n');

  const main = `import java.util.*;

public class Main {
  public static void main(String[] args) {
    java.util.List<String> lines = new java.util.ArrayList<>();
${testBlocks}
    System.out.println("[" + String.join(",", lines) + "]");
  }
${JAVA_CANON_HELPERS}
}
`;
  return { main, solution: code };
}





function finalizeResults(
  results: SandboxTestResult[],
  logs: string[],
  memoryKb?: number,
  statusOverride?: SandboxStatus
): SandboxExecutionResult {
  const total = results.length;
  const passed = results.filter((r) => r.status === 'passed').length;
  const passRateRatio = total > 0 ? passed / total : 0;
  const passRate = Math.round(passRateRatio * 100);
  const totalTimeMs = results.reduce((sum, r) => sum + (r.timeMs || 0), 0);

  
  
  const hasAnyError = results.some((r) => r.status !== 'passed' && r.status !== 'failed');
  const status: SandboxStatus =
    statusOverride || (total > 0 && passRate === 100 && !hasAnyError ? 'passed' : 'failed');

  logs.push(`[Execution Complete] ${passed}/${total} test cases passed (${passRate}%).`);
  return {
    status,
    passRate,
    passRateRatio,
    results,
    executionTimeMs: totalTimeMs,
    memoryKb,
    logs,
  };
}

export async function executeInSandbox(opts: SandboxExecuteOptions): Promise<SandboxExecutionResult> {
  const language = normalizeLanguage(opts.language);
  const logs: string[] = [
    `[Isolated Sandbox ${RUNNER_VERSION}] Target: ${language.toUpperCase()} | Entry Point: ${opts.entryPoint}`,
    `[Limits] CPU ${CPU_LIMIT_SECONDS}s | Mem 256MB | Net disabled | Env scrubbed`,
  ];

  if (!opts.code || !opts.code.trim()) {
    return finalizeResults([], logs, undefined, 'failed');
  }

  if (opts.testCases.length === 0) {
    logs.push('[Execution Error] No persisted test cases to run.');
    return finalizeResults([], logs, undefined, 'failed');
  }

  try {
    if (language === 'python') {
      const outcome = await spawnWithLimits(
        'python3',
        ['-I', '-S', '-u', '-c', PYTHON_RUNNER],
        JSON.stringify({
          code: opts.code,
          entryPoint: opts.entryPoint,
          testCases: opts.testCases,
        })
      );
      return interpretRunnerOutcome(outcome, opts, logs, 'python');
    }

    if (language === 'javascript' || language === 'typescript') {
      
      
      
      const outcome = await spawnWithLimits(
        'node',
        ['--max-old-space-size=256', '--max-semi-space-size=16', '-e', NODE_RUNNER],
        JSON.stringify({
          code: opts.code,
          entryPoint: opts.entryPoint,
          testCases: opts.testCases,
        }),
        {},
        { cpuSeconds: 6, memoryKb: 8388608 }
      );
      return interpretRunnerOutcome(outcome, opts, logs, 'node');
    }

    if (language === 'cpp') {
      return await runCpp(opts, logs);
    }

    if (language === 'java') {
      return await runJava(opts, logs);
    }

    logs.push(`[Execution Error] Unsupported language: ${opts.language}`);
    return finalizeResults([], logs, undefined, 'runtime_error');
  } catch (err) {
    logs.push(`[Execution Error] ${err instanceof Error ? err.message : String(err)}`);
    return finalizeResults([], logs, undefined, 'runtime_error');
  }
}

function interpretRunnerOutcome(
  outcome: SpawnOutcome,
  opts: SandboxExecuteOptions,
  logs: string[],
  kind: 'python' | 'node'
): SandboxExecutionResult {
  
  
  if (outcome.timedOut || outcome.signal === 'SIGXCPU' || outcome.signal === 'SIGKILL') {
    const reason = outcome.timedOut
      ? 'Process exceeded the wall-clock time limit and was killed.'
      : 'Process exceeded the CPU time limit and was killed.';
    logs.push(`[Execution Error] ${reason}`);
    const results: SandboxTestResult[] = opts.testCases.map((t) => ({
      name: t.name,
      status: 'timeout',
      timeMs: 0,
    }));
    return finalizeResults(results, logs, outcome.memoryKb, 'timeout');
  }

  if (outcome.stdoutExceeded) {
    logs.push('[Execution Error] Output exceeded limit and was killed.');
    const results: SandboxTestResult[] = opts.testCases.map((t) => ({
      name: t.name,
      status: 'failed',
      timeMs: 0,
    }));
    return finalizeResults(results, logs, outcome.memoryKb, 'failed');
  }

  const parsed = parseRunnerOutput(outcome.stdout);
  if (!parsed) {
    const stderrLine = (outcome.stderr || '').trim().split('\n').slice(0, 3).join(' | ');
    logs.push(`[Execution Error] Runner produced no result. ${stderrLine ? 'stderr: ' + stderrLine : ''}`);
    const results: SandboxTestResult[] = opts.testCases.map((t) => ({
      name: t.name,
      status: 'error',
      error: stderrLine || 'Runner produced no result',
      timeMs: 0,
    }));
    return finalizeResults(results, logs, outcome.memoryKb, 'runtime_error');
  }

  if (!parsed.ok) {
    const msg = typeof parsed.error === 'string' ? parsed.error : 'Runner failed';
    logs.push(`[Execution Error] ${msg}`);
    const status: SandboxStatus = /securityerror|not found in candidate/i.test(msg)
      ? 'failed'
      : msg.startsWith('SyntaxError') || msg.startsWith('Compile')
        ? 'compile_error'
        : 'runtime_error';
    const results: SandboxTestResult[] = opts.testCases.map((t) => ({
      name: t.name,
      status: 'error',
      error: msg,
      timeMs: 0,
    }));
    return finalizeResults(results, logs, outcome.memoryKb, status);
  }

  const rawResults: any[] = parsed.results || [];
  const results: SandboxTestResult[] = rawResults.map((r, i) => {
    const test = opts.testCases[i];
    if (r.status === 'error') {
      return {
        name: typeof r.name === 'string' ? r.name : test?.name || `Case ${i + 1}`,
        status: 'error' as const,
        error: r.error,
        timeMs: typeof r.timeMs === 'number' ? r.timeMs : 0,
      };
    }
    const actual = r.actual;
    const expected = test?.expected;
    const passed = outputsEqual(actual, expected);
    return {
      name: typeof r.name === 'string' ? r.name : test?.name || `Case ${i + 1}`,
      status: passed ? ('passed' as const) : ('failed' as const),
      actual,
      timeMs: typeof r.timeMs === 'number' ? r.timeMs : 0,
    };
  });

  logs.push(`[Runtime] ${kind.toUpperCase()} executed ${results.length} test case(s).`);
  return finalizeResults(results, logs, outcome.memoryKb);
}

async function runCpp(opts: SandboxExecuteOptions, logs: string[]): Promise<SandboxExecutionResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nr-cpp-'));
  const srcPath = path.join(tmpDir, 'solution.cpp');
  const binPath = path.join(tmpDir, 'solution');
  try {
    const harness = buildCppHarness(opts.code, opts.entryPoint, opts.testCases);
    fs.writeFileSync(srcPath, harness, 'utf-8');

    const compile = await spawnWithLimits(
      'g++',
      ['-std=c++17', '-O2', srcPath, '-o', binPath],
      '',
      {},
      
      
      { cpuSeconds: 30, memoryKb: 4194304, fileSizeBlocks: 20480, timeoutMs: 60000 }
    );
    if (compile.code !== 0) {
      const err = compile.stderr.trim().split('\n').slice(0, 4).join('\n');
      logs.push(`[Compile Error] ${err}`);
      const results: SandboxTestResult[] = opts.testCases.map((t) => ({
        name: t.name,
        status: 'error',
        error: 'CompileError',
        timeMs: 0,
      }));
      return finalizeResults(results, logs, compile.memoryKb, 'compile_error');
    }

    const run = await spawnWithLimits(binPath, [], '');
    if (run.timedOut || run.signal === 'SIGXCPU' || run.signal === 'SIGKILL') {
      logs.push('[Execution Error] C++ binary exceeded the time limit and was killed.');
      const results: SandboxTestResult[] = opts.testCases.map((t) => ({
        name: t.name,
        status: 'timeout',
        timeMs: 0,
      }));
      return finalizeResults(results, logs, run.memoryKb, 'timeout');
    }
    if (run.code !== 0) {
      const err = run.stderr.trim().split('\n').slice(0, 3).join('\n');
      logs.push(`[Runtime Error] exit ${run.code}${err ? ' | ' + err : ''}`);
      const results: SandboxTestResult[] = opts.testCases.map((t) => ({
        name: t.name,
        status: 'error',
        error: err || `exit ${run.code}`,
        timeMs: 0,
      }));
      return finalizeResults(results, logs, run.memoryKb, 'runtime_error');
    }

    const parsed = parseRunnerOutput(`__NR__${run.stdout.trim()}`);
    if (!parsed || !parsed.ok || !Array.isArray(parsed.results)) {
      logs.push('[Runtime Error] C++ harness produced no parseable result.');
      const results: SandboxTestResult[] = opts.testCases.map((t) => ({
        name: t.name,
        status: 'error',
        error: 'Unparseable harness output',
        timeMs: 0,
      }));
      return finalizeResults(results, logs, run.memoryKb, 'runtime_error');
    }

    const results: SandboxTestResult[] = parsed.results.map((r: any, i: number) => ({
      name: typeof r.name === 'string' ? r.name : opts.testCases[i]?.name || `Case ${i + 1}`,
      status: r.status === 'passed' ? ('passed' as const) : r.status === 'error' ? ('error' as const) : ('failed' as const),
      actual: typeof r.actual === 'string' ? r.actual : r.actual,
      error: r.error,
      timeMs: 0,
    }));
    logs.push('[Runtime] C++ executed all persisted test cases.');
    return finalizeResults(results, logs, run.memoryKb);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      
    }
  }
}

async function runJava(opts: SandboxExecuteOptions, logs: string[]): Promise<SandboxExecutionResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nr-java-'));
  const mainPath = path.join(tmpDir, 'Main.java');
  const solPath = path.join(tmpDir, 'Solution.java');
  try {
    const { main, solution } = buildJavaHarness(opts.code, opts.entryPoint, opts.testCases);
    fs.writeFileSync(mainPath, main, 'utf-8');
    fs.writeFileSync(solPath, solution, 'utf-8');

    const compile = await spawnWithLimits(
      'javac',
      ['-J-Xmx256m', mainPath, solPath],
      '',
      {},
      
      
      
      { cpuSeconds: 30, memoryKb: 4194304, fileSizeBlocks: 20480, timeoutMs: 60000 }
    );
    if (compile.code !== 0) {
      const err = compile.stderr.trim().split('\n').slice(0, 4).join('\n');
      logs.push(`[Compile Error] ${err}`);
      const results: SandboxTestResult[] = opts.testCases.map((t) => ({
        name: t.name,
        status: 'error',
        error: 'CompileError',
        timeMs: 0,
      }));
      return finalizeResults(results, logs, compile.memoryKb, 'compile_error');
    }

    const run = await spawnWithLimits(
      'java',
      ['-Xmx256m', '-cp', tmpDir, 'Main'],
      '',
      {},
      { cpuSeconds: 6, memoryKb: 4194304 }
    );
    if (run.timedOut || run.signal === 'SIGXCPU' || run.signal === 'SIGKILL') {
      logs.push('[Execution Error] Java process exceeded the time limit and was killed.');
      const results: SandboxTestResult[] = opts.testCases.map((t) => ({
        name: t.name,
        status: 'timeout',
        timeMs: 0,
      }));
      return finalizeResults(results, logs, run.memoryKb, 'timeout');
    }
    if (run.code !== 0) {
      const err = run.stderr.trim().split('\n').slice(0, 3).join('\n');
      logs.push(`[Runtime Error] exit ${run.code}${err ? ' | ' + err : ''}`);
      const results: SandboxTestResult[] = opts.testCases.map((t) => ({
        name: t.name,
        status: 'error',
        error: err || `exit ${run.code}`,
        timeMs: 0,
      }));
      return finalizeResults(results, logs, run.memoryKb, 'runtime_error');
    }

    const parsed = parseRunnerOutput(`__NR__${run.stdout.trim()}`);
    if (!parsed || !parsed.ok || !Array.isArray(parsed.results)) {
      logs.push('[Runtime Error] Java harness produced no parseable result.');
      const results: SandboxTestResult[] = opts.testCases.map((t) => ({
        name: t.name,
        status: 'error',
        error: 'Unparseable harness output',
        timeMs: 0,
      }));
      return finalizeResults(results, logs, run.memoryKb, 'runtime_error');
    }

    const results: SandboxTestResult[] = parsed.results.map((r: any, i: number) => ({
      name: typeof r.name === 'string' ? r.name : opts.testCases[i]?.name || `Case ${i + 1}`,
      status: r.status === 'passed' ? ('passed' as const) : r.status === 'error' ? ('error' as const) : ('failed' as const),
      actual: typeof r.actual === 'string' ? r.actual : r.actual,
      error: r.error,
      timeMs: 0,
    }));
    logs.push('[Runtime] Java executed all persisted test cases.');
    return finalizeResults(results, logs, run.memoryKb);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      
    }
  }
}
