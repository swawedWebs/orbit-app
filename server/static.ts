import express, { type Express } from "express";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "client");

  console.log("Serving static files from:", distPath);

  app.use(express.static(distPath));

  // Catch-all route
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
