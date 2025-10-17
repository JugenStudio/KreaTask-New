
// This script reads the transformed JSON data and imports it into the PostgreSQL database using Prisma.
// It should be run after the schema has been pushed to the database (`npx prisma db push`).

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_FILE = path.join(__dirname, '..', 'transformed-data.json');

async function main() {
  console.log('🚀 Starting data import process...');

  try {
    // 1. Read the transformed data file
    if (!fs.existsSync(DATA_FILE)) {
      console.error(`❌ Error: Transformed data file not found at ${DATA_FILE}`);
      console.error('Please run the Phase 2 script (migrate-firestore-to-json.js) first.');
      process.exit(1);
    }
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const { users, tasks, notifications, comments, revisions, files, subtasks } = JSON.parse(rawData);
    console.log('✅ Successfully read transformed data file.');

    // 2. Import Users
    console.log(`\n🔄 Importing ${users.length} users...`);
    const userResult = await prisma.user.createMany({
      data: users,
      skipDuplicates: true, // Prevent errors if a user already exists
    });
    console.log(`✅ Imported ${userResult.count} new users.`);

    // 3. Import Tasks
    console.log(`\n🔄 Importing ${tasks.length} tasks...`);
    const taskResult = await prisma.task.createMany({
      data: tasks,
      skipDuplicates: true,
    });
    console.log(`✅ Imported ${taskResult.count} new tasks.`);

    // 4. Import Notifications
    console.log(`\n🔄 Importing ${notifications.length} notifications...`);
    const notificationResult = await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });
    console.log(`✅ Imported ${notificationResult.count} new notifications.`);

    // 5. Import Comments
    console.log(`\n🔄 Importing ${comments.length} comments...`);
    const commentResult = await prisma.comment.createMany({
      data: comments,
      skipDuplicates: true,
    });
    console.log(`✅ Imported ${commentResult.count} new comments.`);

    // 6. Import Revisions
    consolelog(`\n🔄 Importing ${revisions.length} revisions...`);
    const revisionResult = await prisma.revision.createMany({
      data: revisions,
      skipDuplicates: true,
    });
    console.log(`✅ Imported ${revisionResult.count} new revisions.`);

    // 7. Import Files
    console.log(`\n🔄 Importing ${files.length} files...`);
    const fileResult = await prisma.file.createMany({
      data: files,
      skipDuplicates: true,
    });
    console.log(`✅ Imported ${fileResult.count} new files.`);

    // 8. Import Subtasks
    console.log(`\n🔄 Importing ${subtasks.length} subtasks...`);
    const subtaskResult = await prisma.subtask.createMany({
      data: subtasks,
      skipDuplicates: true,
    });
    console.log(`✅ Imported ${subtaskResult.count} new subtasks.`);

    console.log('\n\n🎉 Data import complete! Your PostgreSQL database is now populated.');

  } catch (error) {
    console.error('❌ A critical error occurred during the data import:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔚 Prisma client disconnected.');
  }
}

main();
