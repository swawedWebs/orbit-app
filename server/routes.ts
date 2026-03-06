import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGoalSchema } from "@shared/schema";
import { requireAuth } from "./auth";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const createGoalBody = z.object({
  name: z.string().min(1).max(30),
  category: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().optional(),
  tasks: z.array(z.string().min(1)).min(1, "At least one task is required"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/goals", requireAuth, async (req, res) => {
    const goals = await storage.getGoalsWithTasks(req.user!.id);
    res.json(goals);
  });

  app.post("/api/goals", requireAuth, async (req, res) => {
    const parsed = createGoalBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid goal data", errors: parsed.error.issues });
    }
    const { tasks: taskNames, ...goalData } = parsed.data;
    const goal = await storage.createGoal(goalData, req.user!.id, taskNames);
    res.status(201).json(goal);
  });

  app.delete("/api/goals/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await storage.getGoal(id);
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ message: "Goal not found" });
    }
    await storage.deleteGoal(id);
    res.status(204).send();
  });

  app.patch("/api/tasks/:id/toggle", requireAuth, async (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = await storage.toggleTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  app.post("/api/goals/:id/tasks", requireAuth, async (req, res) => {
    const goalId = parseInt(req.params.id);
    const existing = await storage.getGoal(goalId);
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ message: "Goal not found" });
    }
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Task name is required" });
    }
    const task = await storage.addTask(goalId, name);
    res.status(201).json(task);
  });

  app.patch("/api/goals/reorder", requireAuth, async (req, res) => {
    const { goalIds } = req.body;
    if (!Array.isArray(goalIds)) {
      return res.status(400).json({ message: "goalIds must be an array" });
    }
    await storage.reorderGoals(req.user!.id, goalIds);
    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    const taskId = parseInt(req.params.id);
    const deleted = await storage.deleteTask(taskId);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(204).send();
  });

  app.post("/api/coach", requireAuth, async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const goals = await storage.getGoalsWithTasks(req.user!.id);
    const goalSummary = goals.map((g) => {
      const done = g.tasks.filter((t) => t.done).length;
      const total = g.tasks.length;
      return `${g.icon || "🎯"} ${g.name}: ${g.progress}% (${done}/${total} tasks done)`;
    }).join("\n");

    const systemPrompt = `You are Orbit, an AI life strategist that helps people improve health, money, career, learning, and relationships. You give concise, actionable advice.

Here are the user's current goals and progress:
${goalSummary || "No goals set yet."}

Keep responses under 150 words. Be encouraging but direct. Reference their specific goals when relevant.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
      });

      const reply = response.choices[0]?.message?.content || "I couldn't generate advice right now. Try again.";
      res.json({ reply });
    } catch (error) {
      console.error("Coach API error:", error);
      res.status(500).json({ message: "Failed to get advice" });
    }
  });

  return httpServer;
}
