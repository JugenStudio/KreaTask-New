
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccount } from '@auth/core/adapters';

// Users Table
export const users = pgTable('user', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: text('role').default('Unassigned').notNull(),
  jabatan: text('jabatan'),
  password: text('password'), // Added for storing hashed passwords
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  tasks: many(tasksToUsers),
  notifications: many(notifications),
  comments: many(comments),
  revisions: many(revisions),
}));

// Tasks Table
export const tasks = pgTable('task', {
  id: text('id').notNull().primaryKey(),
  titleEn: text('titleEn').notNull(),
  titleId: text('titleId').notNull(),
  descriptionEn: text('descriptionEn'),
  descriptionId: text('descriptionId'),
  status: varchar('status', { length: 50 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  dueDate: timestamp('dueDate', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  value: integer('value').notNull(),
  valueCategory: varchar('valueCategory', { length: 50 }),
  evaluator: varchar('evaluator', { length: 100 }),
  approvedBy: text('approvedBy'),
});

export const tasksRelations = relations(tasks, ({ many }) => ({
  assignees: many(tasksToUsers),
  comments: many(comments),
  revisions: many(revisions),
  files: many(files),
  subtasks: many(subtasks),
  notifications: many(notifications),
}));

// Join table for Tasks and Users (Many-to-Many)
export const tasksToUsers = pgTable(
  'tasks_to_users',
  {
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.taskId, t.userId] }),
  })
);

export const tasksToUsersRelations = relations(tasksToUsers, ({ one }) => ({
    task: one(tasks, {
        fields: [tasksToUsers.taskId],
        references: [tasks.id],
    }),
    user: one(users, {
        fields: [tasksToUsers.userId],
        references: [users.id],
    }),
}));

// Comments Table
export const comments = pgTable('comment', {
  id: text('id').notNull().primaryKey(),
  contentEn: text('contentEn'),
  contentId: text('contentId'),
  isPinned: boolean('isPinned').default(false),
  timestamp: timestamp('timestamp', { mode: 'date' }).defaultNow().notNull(),
  authorId: text('authorId').references(() => users.id, { onDelete: 'set null' }),
  taskId: text('taskId').references(() => tasks.id, { onDelete: 'cascade' }),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
}));

// Revisions Table
export const revisions = pgTable('revision', {
  id: text('id').notNull().primaryKey(),
  changeEn: text('changeEn'),
  changeId: text('changeId'),
  timestamp: timestamp('timestamp', { mode: 'date' }).defaultNow().notNull(),
  authorId: text('authorId').references(() => users.id, { onDelete: 'set null' }),
  taskId: text('taskId').references(() => tasks.id, { onDelete: 'cascade' }),
});

export const revisionsRelations = relations(revisions, ({ one }) => ({
  author: one(users, {
    fields: [revisions.authorId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [revisions.taskId],
    references: [tasks.id],
  }),
}));

// Files Table
export const files = pgTable('file', {
  id: text('id').notNull().primaryKey(),
  name: text('name').notNull(),
  type: varchar('type', { length: 50 }),
  url: text('url').notNull(),
  size: text('size'),
  note: text('note'),
  taskId: text('taskId').references(() => tasks.id, { onDelete: 'cascade' }),
});

export const filesRelations = relations(files, ({ one }) => ({
  task: one(tasks, {
    fields: [files.taskId],
    references: [tasks.id],
  }),
}));

// Subtasks Table
export const subtasks = pgTable('subtask', {
  id: text('id').notNull().primaryKey(),
  title: text('title').notNull(),
  isCompleted: boolean('isCompleted').default(false),
  taskId: text('taskId').references(() => tasks.id, { onDelete: 'cascade' }),
});

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

// Notifications Table
export const notifications = pgTable('notification', {
  id: text('id').notNull().primaryKey(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }),
  read: boolean('read').default(false),
  link: text('link'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
  taskId: text('taskId').references(() => tasks.id, { onDelete: 'set null' }),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
}));

// Auth.js / NextAuth Tables
export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);
