// غرفة تتبع حركة الناقلات — خادم مستقل (بدون أي حزم خارجية)
// يعمل بأمر واحد: node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "records.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function readRecords() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

function writeRecords(records) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf8");
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 2 * 1024 * 1024) {
        reject(new Error("الطلب كبير جداً"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("JSON غير صالح"));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res, urlPath) {
  let filePath = urlPath === "/" ? "/index.html" : urlPath;
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(PUBLIC_DIR, filePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // Fallback to index.html for any unknown front-end route
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (err2, indexData) => {
        if (err2) {
          res.writeHead(404);
          return res.end("Not found");
        }
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(indexData);
      });
      return;
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  try {
    // --- API: /api/records ---
    if (p === "/api/records" && req.method === "GET") {
      return sendJSON(res, 200, readRecords());
    }

    if (p === "/api/records" && req.method === "POST") {
      const body = await readBody(req);
      const records = readRecords();
      const newRecord = { id: crypto.randomUUID(), ...body };
      records.unshift(newRecord);
      writeRecords(records);
      return sendJSON(res, 201, newRecord);
    }

    const singleMatch = p.match(/^\/api\/records\/([^/]+)$/);
    if (singleMatch && req.method === "PUT") {
      const id = decodeURIComponent(singleMatch[1]);
      const body = await readBody(req);
      const records = readRecords();
      const idx = records.findIndex((r) => r.id === id);
      if (idx === -1) return sendJSON(res, 404, { error: "غير موجود" });
      records[idx] = { ...records[idx], ...body, id };
      writeRecords(records);
      return sendJSON(res, 200, records[idx]);
    }

    if (singleMatch && req.method === "DELETE") {
      const id = decodeURIComponent(singleMatch[1]);
      const records = readRecords();
      const next = records.filter((r) => r.id !== id);
      writeRecords(next);
      return sendJSON(res, 200, { ok: true });
    }

    if (p === "/api/records/bulk-delete" && req.method === "POST") {
      const body = await readBody(req);
      const ids = new Set(body.ids || []);
      const records = readRecords();
      const next = records.filter((r) => !ids.has(r.id));
      writeRecords(next);
      return sendJSON(res, 200, { ok: true, remaining: next.length });
    }

    if (p.startsWith("/api/")) {
      return sendJSON(res, 404, { error: "مسار غير معروف" });
    }

    // --- Static frontend ---
    if (req.method === "GET") {
      return serveStatic(req, res, p);
    }

    res.writeHead(405);
    res.end("Method not allowed");
  } catch (err) {
    sendJSON(res, 400, { error: err.message || "خطأ في الطلب" });
  }
});

server.listen(PORT, () => {
  console.log(`✓ غرفة تتبع الناقلات تعمل على http://localhost:${PORT}`);
});
