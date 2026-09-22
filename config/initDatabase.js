const { pool } = require("./database");

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      guest_count INT UNSIGNED NOT NULL DEFAULT 1,
      note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_phone (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query("ALTER TABLE rsvps MODIFY phone VARCHAR(20) NOT NULL");
  await pool.query("ALTER TABLE rsvps ADD UNIQUE KEY unique_phone (phone)").catch((error) => {
    if (error.code !== "ER_DUP_KEYNAME" && error.code !== "ER_DUP_ENTRY") {
      throw error;
    }
  });
}

module.exports = ensureTables;
