const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const name = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (name && !process.env[name]) {
      process.env[name] = value;
    }
  }
}

loadEnv();

const port = process.env.PORT || 3000;

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/search") {
    const title = url.searchParams.get("s")?.trim();

    if (!title) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Veuillez saisir un titre" }));
      return;
    }

    try {
      const omdbUrl = new URL(process.env.URL_API_OMDB);
      omdbUrl.searchParams.set("apikey", process.env.API_KEY_OMDB);
      omdbUrl.searchParams.set("s", title);

      const omdbResponse = await fetch(omdbUrl);
      const data = await omdbResponse.json();

      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(data));
    } catch (error) {
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Impossible de contacter OMDb" }));
    }
    return;
  }

  fs.readFile(path.join(__dirname, "index.html"), (error, html) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Fichier introuvable");
      return;
    }

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
  });
});

server.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
