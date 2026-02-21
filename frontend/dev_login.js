// Script para criar usuário/sessão no MongoDB e abrir navegador autenticado
// Requisitos: npm install puppeteer mongodb

const { MongoClient } = require('mongodb');
const puppeteer = require('puppeteer');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'agendamento';
const FRONTEND_URL = 'http://localhost:3000/admin';

async function createTestUserAndSession() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const now = Date.now();
  const userId = `user_${now}`;
  const sessionToken = `test_session_${now}`;
  const user = {
    user_id: userId,
    email: `test.user.${now}@example.com`,
    name: 'Test User',
    picture: 'https://via.placeholder.com/150',
    tenant_id: 'tenant_demo',
    role: 'admin',
    created_at: new Date()
  };
  const session = {
    user_id: userId,
    session_token: sessionToken,
    expires_at: new Date(Date.now() + 7*24*60*60*1000),
    created_at: new Date()
  };
  await db.collection('users').insertOne(user);
  await db.collection('user_sessions').insertOne(session);
  await client.close();
  return { sessionToken, userId };
}

async function openBrowserWithSession(sessionToken) {
  const browser = await puppeteer.launch({ headless: false });
  let page;
  const pages = await browser.pages();
  if (pages.length === 1 && pages[0].url() === 'about:blank') {
    // Usa a aba existente se for a única
    page = pages[0];
  } else if (pages.length > 1 && pages[0].url() === 'about:blank') {
    // Fecha a about:blank se houver mais de uma
    await pages[0].close();
    page = await browser.newPage();
  } else {
    // Cria nova aba normalmente
    page = await browser.newPage();
  }
  // Set cookie para localhost
  await page.setCookie({
    name: 'session_token',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax'
  });
  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
  await page.bringToFront();
  // Navegador ficará aberto para interação manual
}

(async () => {
  const { sessionToken, userId } = await createTestUserAndSession();
  console.log('Usuário de teste criado:', userId);
  console.log('Session token:', sessionToken);
  await openBrowserWithSession(sessionToken);
})();
