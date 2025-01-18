import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedDesigns = pgTable("saved_designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  designImages: jsonb("design_images").notNull().$type<string[]>(),
  style: text("style").notNull(),
  roomType: text("room_type").notNull(),
  colorTheme: text("color_theme").notNull(),
  prompt: text("prompt"),
  originalImage: text("original_image").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
  designs: many(savedDesigns),
}));

export const savedDesignsRelations = relations(savedDesigns, ({ one }) => ({
  user: one(users, {
    fields: [savedDesigns.userId],
    references: [users.id],
  }),
}));

// Create Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertSavedDesignSchema = createInsertSchema(savedDesigns);
export const selectSavedDesignSchema = createSelectSchema(savedDesigns);

// Export types for TypeScript
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertSavedDesign = typeof savedDesigns.$inferInsert;
export type SelectSavedDesign = typeof savedDesigns.$inferSelect;