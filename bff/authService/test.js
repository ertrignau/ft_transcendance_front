require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const OK  = '\x1b[32m✓\x1b[0m';
const ERR = '\x1b[31m✗\x1b[0m';
const INF = '\x1b[36mℹ\x1b[0m';

async function run() {
  console.log('\n══════════════════════════════════════');
  console.log('  TEST Prisma + PostgreSQL (Auth)');
  console.log('══════════════════════════════════════\n');

  const testEmail = `test_${Date.now()}@example.com`;

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
    const hashed = await bcrypt.hash('TestPassword123!', 10);
    const auth = await prisma.auth.create({
      data: { userId: uuidv4(), email: testEmail, login42: null, password: hashed },
    });
    console.log(`${OK} CREATE — id=${auth.id}, email=${auth.email}`);
  } catch (e) {
    console.error(`${ERR} CREATE échoué :`, e.message);
  }

  // 3. READ
  try {
    const auth = await prisma.auth.findUnique({ where: { email: testEmail } });
    auth
      ? console.log(`${OK} READ   — userId=${auth.userId}, createdAt=${auth.createdAt}`)
      : console.log(`${ERR} READ   — Aucun enregistrement trouvé`);
  } catch (e) {
    console.error(`${ERR} READ échoué :`, e.message);
  }

  // 4. UPDATE
  try {
    const updated = await prisma.auth.update({
      where: { email: testEmail },
      data:  { login42: 'testlogin42' },
    });
    console.log(`${OK} UPDATE — login42=${updated.login42}`);
  } catch (e) {
    console.error(`${ERR} UPDATE échoué :`, e.message);
  }

  // 5. FINDMANY
  try {
    const all = await prisma.auth.findMany({ select: { id: true, email: true } });
    console.log(`${INF} FINDMANY — ${all.length} enregistrement(s) en base`);
  } catch (e) {
    console.error(`${ERR} FINDMANY échoué :`, e.message);
  }

  // 6. BCRYPT
  try {
    const auth = await prisma.auth.findUnique({ where: { email: testEmail } });
    const match = await bcrypt.compare('TestPassword123!', auth.password);
    console.log(`${match ? OK : ERR} BCRYPT — Vérification mot de passe : ${match ? 'OK' : 'ÉCHEC'}`);
  } catch (e) {
    console.error(`${ERR} BCRYPT échoué :`, e.message);
  }

  // 7. UNICITÉ
  try {
    await prisma.auth.create({
      data: { userId: uuidv4(), email: testEmail, password: 'xxx' },
    });
    console.log(`${ERR} UNIQUE  — Aurait dû lever une erreur P2002 !`);
  } catch (e) {
    e.code === 'P2002'
      ? console.log(`${OK} UNIQUE  — Contrainte unique bien respectée (P2002)`)
      : console.error(`${ERR} UNIQUE  — Erreur inattendue :`, e.message);
  }

  // 8. DELETE
  try {
    await prisma.auth.delete({ where: { email: testEmail } });
    console.log(`${OK} DELETE  — Entrée de test supprimée\n`);
  } catch (e) {
    console.error(`${ERR} DELETE échoué :`, e.message);
  }

  await prisma.$disconnect();
  console.log('══════════════════════════════════════');
  console.log('  Tests terminés');
  console.log('══════════════════════════════════════\n');
}

run().catch(async (e) => {
  console.error('Erreur fatale :', e);
  await prisma.$disconnect();
  process.exit(1);
});