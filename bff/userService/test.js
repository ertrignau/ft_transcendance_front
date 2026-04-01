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
  console.log('  TEST Prisma + PostgreSQL (User)');
  console.log('══════════════════════════════════════\n');

  const testUsername = `user_${Date.now()}`;
  let createdId = null;

  // 1. Connexion
  try {
    await prisma.$connect();
    console.log(`${OK} Connexion à PostgreSQL réussie`);
  } catch (e) {
    console.error(`${ERR} Connexion échouée :`, e.message);
    process.exit(1);
  }

  // 2. CREATE
  try {
    const user = await prisma.user.create({
      data: {
        id:        uuidv4(),
        username:  testUsername,
        firstName: 'John',
        lastName:  'Doe',
        avatar:    null,
        theme:     'LIGHT',
        langue:    'en',
      },
    });
    createdId = user.id;
    console.log(`${OK} CREATE — id=${user.id}, username=${user.username}`);
  } catch (e) {
    console.error(`${ERR} CREATE failed :`, e.message);
  }

  // 3. READ
  try {
    const user = await prisma.user.findUnique({ where: { id: createdId } });
    user
      ? console.log(`${OK} READ   — username=${user.username}, createdAt=${user.createdAt}`)
      : console.log(`${ERR} READ   — No record found`);
  } catch (e) {
    console.error(`${ERR} READ failed :`, e.message);
  }

  // 4. UPDATE
  try {
    const updated = await prisma.user.update({
      where: { id: createdId },
      data:  { theme: 'DARK', langue: 'fr' },
    });
    console.log(`${OK} UPDATE — theme=${updated.theme}, langue=${updated.langue}`);
  } catch (e) {
    console.error(`${ERR} UPDATE failed :`, e.message);
  }

  // 5. FINDMANY
  try {
    const all = await prisma.user.findMany({ select: { id: true, username: true } });
    console.log(`${INF} FINDMANY — ${all.length} record(s) in database`);
  } catch (e) {
    console.error(`${ERR} FINDMANY failed :`, e.message);
  }

  // 6. UNICITÉ
  try {
    await prisma.user.create({
      data: { id: uuidv4(), username: testUsername, firstName: 'Jane', lastName: 'Doe' },
    });
    console.log(`${ERR} UNIQUE  — Should have thrown P2002 !`);
  } catch (e) {
    e.code === 'P2002'
      ? console.log(`${OK} UNIQUE  — Unique constraint respected (P2002)`)
      : console.error(`${ERR} UNIQUE  — Unexpected error :`, e.message);
  }

  // 7. DELETE
  try {
    await prisma.user.delete({ where: { id: createdId } });
    console.log(`${OK} DELETE  — Test record deleted\n`);
  } catch (e) {
    console.error(`${ERR} DELETE failed :`, e.message);
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