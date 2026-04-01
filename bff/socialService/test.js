require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { v4: uuidv4 } = require('uuid');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const OK  = '\x1b[32m✓\x1b[0m';
const ERR = '\x1b[31m✗\x1b[0m';
const INF = '\x1b[36mℹ\x1b[0m';

async function run() {
  console.log('\n══════════════════════════════════════');
  console.log('  TEST Prisma + PostgreSQL (Social)');
  console.log('══════════════════════════════════════\n');

  const userA  = uuidv4();
  const userB  = uuidv4();
  const userC  = uuidv4();
  let createdId = null;

  // 1. Connexion
  try {
    await prisma.$connect();
    console.log(`${OK} Connection to PostgreSQL successful`);
  } catch (e) {
    console.error(`${ERR} Connection failed :`, e.message);
    process.exit(1);
  }

  // 2. CREATE
  try {
    const social = await prisma.social.create({
      data: { id: uuidv4(), userId: userA, friendId: userB },
    });
    createdId = social.id;
    console.log(`${OK} CREATE — id=${social.id}, userId=${social.userId}, friendId=${social.friendId}`);
  } catch (e) {
    console.error(`${ERR} CREATE failed :`, e.message);
  }

  // 3. READ
  try {
    const social = await prisma.social.findUnique({ where: { id: createdId } });
    social
      ? console.log(`${OK} READ   — userId=${social.userId}, createdAt=${social.createdAt}`)
      : console.log(`${ERR} READ   — No record found`);
  } catch (e) {
    console.error(`${ERR} READ failed :`, e.message);
  }

  // 4. FINDMANY
  try {
    const all = await prisma.social.findMany();
    console.log(`${INF} FINDMANY — ${all.length} record(s) in database`);
  } catch (e) {
    console.error(`${ERR} FINDMANY failed :`, e.message);
  }

  // 5. UNICITÉ [userId, friendId]
  try {
    await prisma.social.create({
      data: { id: uuidv4(), userId: userA, friendId: userB },
    });
    console.log(`${ERR} UNIQUE  — Should have thrown P2002 !`);
  } catch (e) {
    e.code === 'P2002'
      ? console.log(`${OK} UNIQUE  — Unique constraint respected (P2002)`)
      : console.error(`${ERR} UNIQUE  — Unexpected error :`, e.message);
  }

  // 6. MÊME userId ET friendId
  try {
    await prisma.social.create({
      data: { id: uuidv4(), userId: userA, friendId: userA },
    });
    console.log(`${INF} SELF    — Self-friendship created (handled at controller level)`);
    await prisma.social.deleteMany({ where: { userId: userA, friendId: userA } });
  } catch (e) {
    console.error(`${ERR} SELF    — Unexpected error :`, e.message);
  }

  // 7. GET FRIENDS (userId = userA)
  try {
    await prisma.social.create({
      data: { id: uuidv4(), userId: userA, friendId: userC },
    });
    const friends = await prisma.social.findMany({ where: { userId: userA } });
    console.log(`${OK} FRIENDS — userA has ${friends.length} friend(s)`);
  } catch (e) {
    console.error(`${ERR} FRIENDS failed :`, e.message);
  }

  // 8. GET FOLLOWERS (friendId = userA)
  try {
    await prisma.social.create({
      data: { id: uuidv4(), userId: userC, friendId: userA },
    });
    const followers = await prisma.social.findMany({ where: { friendId: userA } });
    console.log(`${OK} FOLLOWERS — userA has ${followers.length} follower(s)`);
  } catch (e) {
    console.error(`${ERR} FOLLOWERS failed :`, e.message);
  }

  // 9. DELETE USER SOCIALS (userId ou friendId = userA)
  try {
    const { count } = await prisma.social.deleteMany({
      where: { OR: [{ userId: userA }, { friendId: userA }] },
    });
    console.log(`${OK} DELETE USER SOCIALS — ${count} record(s) deleted for userA`);
  } catch (e) {
    console.error(`${ERR} DELETE USER SOCIALS failed :`, e.message);
  }

  // 10. DELETE (nettoyage)
  try {
    await prisma.social.deleteMany();
    console.log(`${OK} CLEANUP — All test records deleted\n`);
  } catch (e) {
    console.error(`${ERR} CLEANUP failed :`, e.message);
  }

  await prisma.$disconnect();
  console.log('══════════════════════════════════════');
  console.log('  Tests done');
  console.log('══════════════════════════════════════\n');
}

run().catch(async (e) => {
  console.error('Fatal error :', e);
  await prisma.$disconnect();
  process.exit(1);
});