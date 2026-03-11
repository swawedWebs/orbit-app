import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "client/dist");

  if (!fs.existsSync(distPath)) {
    console.warn("dist folder not found, serving client folder instead");
    app.use(express.static(path.resolve(process.cwd(), "client")));
    return;
  }

  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
