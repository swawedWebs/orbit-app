import { goals, tasks, users, type Goal, type InsertGoal, type Task, type InsertTask, type GoalWithTasks, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

const DEFAULT_GOALS = [
  {
    name: "Health", category: "wellness", color: "#34D399", icon: "🌿",
    tasks: ["Workout", "Drink Water", "Sleep 8 Hours"],
  },
  {
    name: "Career", category: "professional", color: "#6366F1", icon: "📈",
    tasks: ["Apply to Jobs", "Update Resume", "Network"],
  },
  {
    name: "Finances", category: "financial", color: "#F59E0B", icon: "💰",
    tasks: ["Save Money", "Track Expenses", "Invest"],
  },
  {
    name: "Relationships", category: "social", color: "#EC4899", icon: "❤️",
    tasks: ["Call a Friend", "Date Night", "Family Time"],
  },
  {
    name: "Learning", category: "growth", color: "#8B5CF6", icon: "🧠",
    tasks: ["Read a Book", "Online Course", "Practice Skills"],
  },
];

function calcProgress(goalTasks: Task[]): number {
  if (goalTasks.length === 0) return 0;
  const done = goalTasks.filter((t) => t.done).length;
  return Math.round((done / goalTasks.length) * 100);
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  seedGoalsForUser(userId: number): Promise<void>;
  getGoalsWithTasks(userId: number): Promise<GoalWithTasks[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal, userId: number, taskNames: string[]): Promise<GoalWithTasks>;
  deleteGoal(id: number): Promise<boolean>;
  toggleTask(taskId: number): Promise<Task | undefined>;
  addTask(goalId: number, name: string): Promise<Task>;
  deleteTask(taskId: number): Promise<boolean>;
  reorderGoals(userId: number, goalIds: number[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async seedGoalsForUser(userId: number): Promise<void> {
    for (let i = 0; i < DEFAULT_GOALS.length; i++) {
      const g = DEFAULT_GOALS[i];
      const [goal] = await db.insert(goals).values({
        name: g.name,
        category: g.category,
        color: g.color,
        icon: g.icon,
        progress: 0,
        userId,
        sortOrder: i,
      }).returning();

      for (const taskName of g.tasks) {
        await db.insert(tasks).values({ name: taskName, goalId: goal.id, done: false });
      }
    }
  }

  async getGoalsWithTasks(userId: number): Promise<GoalWithTasks[]> {
    const userGoals = await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.sortOrder));
    const result: GoalWithTasks[] = [];

    for (const goal of userGoals) {
      const goalTasks = await db.select().from(tasks).where(eq(tasks.goalId, goal.id));
      const progress = calcProgress(goalTasks);
      if (goal.progress !== progress) {
        await db.update(goals).set({ progress }).where(eq(goals.id, goal.id));
      }
      result.push({ ...goal, progress, tasks: goalTasks });
    }

    return result;
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(insertGoal: InsertGoal, userId: number, taskNames: string[]): Promise<GoalWithTasks> {
    const existing = await db.select().from(goals).where(eq(goals.userId, userId));
    const maxSort = existing.length > 0 ? Math.max(...existing.map((g) => g.sortOrder)) + 1 : 0;
    const [goal] = await db.insert(goals).values({ ...insertGoal, progress: 0, userId, sortOrder: maxSort }).returning();
    const createdTasks: Task[] = [];
    for (const name of taskNames) {
      const [task] = await db.insert(tasks).values({ name, goalId: goal.id, done: false }).returning();
      createdTasks.push(task);
    }
    return { ...goal, tasks: createdTasks };
  }

  async deleteGoal(id: number): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.goalId, id));
    const result = await db.delete(goals).where(eq(goals.id, id)).returning();
    return result.length > 0;
  }

  async toggleTask(taskId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return undefined;
    const [updated] = await db.update(tasks).set({ done: !task.done }).where(eq(tasks.id, taskId)).returning();

    const goalTasks = await db.select().from(tasks).where(eq(tasks.goalId, task.goalId));
    const progress = calcProgress(goalTasks);
    await db.update(goals).set({ progress }).where(eq(goals.id, task.goalId));

    return updated;
  }

  async addTask(goalId: number, name: string): Promise<Task> {
    const [task] = await db.insert(tasks).values({ name, goalId, done: false }).returning();

    const goalTasks = await db.select().from(tasks).where(eq(tasks.goalId, goalId));
    const progress = calcProgress(goalTasks);
    await db.update(goals).set({ progress }).where(eq(goals.id, goalId));

    return task;
  }

  async deleteTask(taskId: number): Promise<boolean> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return false;
    await db.delete(tasks).where(eq(tasks.id, taskId));

    const goalTasks = await db.select().from(tasks).where(eq(tasks.goalId, task.goalId));
    const progress = calcProgress(goalTasks);
    await db.update(goals).set({ progress }).where(eq(goals.id, task.goalId));

    return true;
  }

  async reorderGoals(userId: number, goalIds: number[]): Promise<void> {
    for (let i = 0; i < goalIds.length; i++) {
      await db.update(goals).set({ sortOrder: i }).where(eq(goals.id, goalIds[i]));
    }
  }
}

export const storage = new DatabaseStorage();
