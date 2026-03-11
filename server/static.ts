import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "client");

  if (!fs.existsSync(distPath)) {
    console.log("dist folder not found, serving client folder instead");
  }

  // Serve static files
  app.use(express.static(distPath));

  // Catch-all route for React / SPA routing
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
