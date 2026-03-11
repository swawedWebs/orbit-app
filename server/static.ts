import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    console.error("Dist folder not found:", distPath);
    return;
  }

  console.log("Serving frontend from:", distPath);

  app.use(express.static(distPath));

  app.get("/", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
