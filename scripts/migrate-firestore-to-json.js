// This script exports data from Firestore collections and transforms it
// into a relational format suitable for importing into a PostgreSQL database via Prisma.

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// IMPORTANT: Place your Firebase service account key JSON file in the root of the project.
// Make sure this file is included in your .gitignore to prevent committing it.
const serviceAccount = require('../serviceAccountKey.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'transformed-data.json');
// -------------------

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Fetches all documents from a specified collection.
 * @param {string} collectionName - The name of the Firestore collection.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of documents.
 */
async function fetchCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Successfully fetched ${data.length} documents from "${collectionName}".`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching collection "${collectionName}":`, error);
    throw error;
  }
}

/**
 * Transforms the Firestore data structure into a relational structure for Prisma.
 * @param {Object} firestoreData - The raw data fetched from Firestore.
 * @returns {Object} - The transformed data, ready for Prisma `createMany`.
 */
function transformData(firestoreData) {
  const { users, tasks, notifications } = firestoreData;

  const transformed = {
    users: [],
    tasks: [],
    notifications: [],
    comments: [],
    revisions: [],
    files: [],
    subtasks: [],
  };

  // 1. Transform Users
  transformed.users = users.map(user => ({
    id: user.id,
    name: user.name || 'Unnamed User',
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    role: user.role,
    jabatan: user.jabatan || 'Unassigned',
    // Prisma handles createdAt/updatedAt automatically, but you can preserve them if needed.
    // createdAt: user.createdAt?.toDate() || new Date(),
    // updatedAt: user.updatedAt?.toDate() || new Date(),
  }));

  // 2. Transform Notifications
  transformed.notifications = notifications.map(notif => ({
    id: notif.id,
    message: notif.message,
    type: notif.type,
    read: notif.read || false,
    link: notif.link || null,
    createdAt: notif.createdAt ? new Date(notif.createdAt) : new Date(),
    userId: notif.userId,
    taskId: notif.taskId || null,
  }));

  // 3. Transform Tasks and extract nested collections
  transformed.tasks = tasks.map(task => {
    // Extract and transform nested data first
    if (task.comments && Array.isArray(task.comments)) {
      task.comments.forEach(comment => {
        transformed.comments.push({
          id: comment.id,
          contentEn: comment.content?.en || '',
          contentId: comment.content?.id || '',
          isPinned: comment.isPinned || false,
          timestamp: comment.timestamp ? new Date(comment.timestamp) : new Date(),
          authorId: comment.author?.id,
          taskId: task.id,
        });
      });
    }

    if (task.revisions && Array.isArray(task.revisions)) {
      task.revisions.forEach(revision => {
        transformed.revisions.push({
          id: revision.id,
          changeEn: revision.change?.en || '',
          changeId: revision.change?.id || '',
          timestamp: revision.timestamp ? new Date(revision.timestamp) : new Date(),
          authorId: revision.author?.id,
          taskId: task.id,
        });
      });
    }

    if (task.files && Array.isArray(task.files)) {
      task.files.forEach(file => {
        transformed.files.push({
          id: file.id,
          name: file.name,
          type: file.type,
          url: file.url,
          size: file.size,
          note: file.note || null,
          taskId: task.id,
        });
      });
    }

    if (task.subtasks && Array.isArray(task.subtasks)) {
      task.subtasks.forEach(subtask => {
        transformed.subtasks.push({
          id: subtask.id,
          title: subtask.title,
          isCompleted: subtask.isCompleted || false,
          taskId: task.id,
        });
      });
    }
    
    // The main task object for the `Task` table
    const mainTask = {
      id: task.id,
      titleEn: task.title?.en || '',
      titleId: task.title?.id || '',
      descriptionEn: task.description?.en || '',
      descriptionId: task.description?.id || '',
      status: task.status,
      category: task.category,
      dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
      createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      value: task.value,
      valueCategory: task.valueCategory,
      evaluator: task.evaluator,
      approvedBy: task.approvedBy || null,
    };

    // Handle assignee relationship
    if (task.assignees && task.assignees.length > 0) {
      mainTask.assigneeId = task.assignees[0].id; // Assuming one assignee per task as per new schema
    }

    return mainTask;
  });

  console.log('✅ Data transformation complete.');
  return transformed;
}

/**
 * Main function to run the export and transformation process.
 */
async function main() {
  try {
    console.log('🚀 Starting Firestore data export...');
    const firestoreData = {
      users: await fetchCollection('users'),
      tasks: await fetchCollection('tasks'),
      notifications: await fetchCollection('notifications'),
    };

    console.log('\n🔄 Transforming data for relational schema...');
    const transformedData = transformData(firestoreData);

    console.log('\n💾 Writing transformed data to JSON file...');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(transformedData, null, 2));
    console.log(`\n🎉 Success! Transformed data saved to ${OUTPUT_FILE}`);
    console.log('Next step: Run Phase 3 (User Authentication Migration) and Phase 4 (Data Import).');

  } catch (error)_ {
    console.error('\n❌ A critical error occurred during the migration script:', error);
    process.exit(1);
  }
}

main();
