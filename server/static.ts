import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    console.error("Dist folder not found:", distPath);
    return;
  }

  console.log("Serving static files from:", distPath);

  // Serve built assets
  app.use(express.static(distPath));

  // Catch-all route so React Router works
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
