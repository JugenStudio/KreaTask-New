'use server';

import { neon } from '@neondatabase/serverless';
import { getTaskSuggestion } from './ai/flows/generate-tasks-flow';
import { askKreaBot } from './ai/flows/kreatask-bot-flow';
import { translateContent } from './ai/flows/translate-content-flow';
import { summarizeTaskComments } from './ai/flows/summarize-task-comments';
import type { Task, User } from './lib/types';


export async function getUserDetails(userId: string | undefined) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!userId) {
    return null;
  }
  
  const sql = neon(process.env.DATABASE_URL!);
  // The table is `users_sync` in the `neon_auth` schema
  const [user] = await sql`SELECT * FROM "User" WHERE id = ${userId};`;

  if (user && typeof user.raw_json === 'string') {
    user.raw_json = JSON.parse(user.raw_json);
  }
  
  return user as (User & {raw_json: any}) | null;
}

export async function getTranslations(text: string) {
    try {
        const data = await translateContent({ text });
        return { data };
    } catch (e) {
        console.error("Translation failed:", e);
        return { error: 'Translation failed. Please try again.' };
    }
}

export async function getTaskFromAI(idea: string, users: User[]) {
    try {
        const suggestion = await getTaskSuggestion({ idea, users });
        return { suggestion };
    } catch (e) {
        console.error("AI task generation failed:", e);
        return { error: 'submit.toast.ai_error_generic' };
    }
}

export async function getSummary(prevState: { summary: string | null, error: string | null }, formData: FormData) {
  const commentThread = formData.get('commentThread') as string;
  try {
    const { summary } = await summarizeTaskComments({
      commentThread,
      companyPolicy: 'The summary must be concise and professional.',
    });
    return { summary, error: null };
  } catch (e) {
    console.error("Summarization failed:", e);
    return { summary: null, error: "Failed to generate summary." };
  }
}

export async function getKreaBotResponse(query: string, allTasks: Task[], users: User[]) {
    try {
        const { response } = await askKreaBot({ query, tasks: allTasks, users });
        return { response };
    } catch (e) {
        console.error("KreaBot failed:", e);
        return { error: "I encountered an error. Please try again." };
    }
}
