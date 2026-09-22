const mysql = require("mysql2/promise");

const databaseName = process.env.DB_NAME || "natal_rsvp";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};

const pool = mysql.createPool({
  ...dbConfig,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
});

function safeDatabaseName(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error("DB_NAME hanya boleh berisi huruf, angka, dan underscore.");
  }
  return name;
}

async function ensureDatabase() {
  const setup = await mysql.createConnection(dbConfig);
  const safeName = safeDatabaseName(databaseName);

  await setup.query(`CREATE DATABASE IF NOT EXISTS \`${safeName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await setup.end();
}

module.exports = {
  pool,
  ensureDatabase,
};
