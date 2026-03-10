import { pgTable, text, integer, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  progress: integer("progress").notNull().default(0),
  category: text("category").notNull().default("general"),
  color: text("color").notNull().default("#3b82f6"),
  icon: text("icon").notNull().default("🎯"),
  userId: integer("user_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, userId: true, progress: true, sortOrder: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  done: boolean("done").notNull().default(false),
  goalId: integer("goal_id").notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type GoalWithTasks = Goal & { tasks: Task[] };
