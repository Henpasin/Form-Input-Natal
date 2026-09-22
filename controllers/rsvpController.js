const { pool } = require("../config/database");
const { rsvp: config } = require("../config/appConfig");

async function getRegisteredCount() {
  const [rows] = await pool.query("SELECT COALESCE(SUM(guest_count), 0) AS total FROM rsvps");
  return Number(rows[0].total || 0);
}

function isClosed(registered) {
  return registered >= config.limit || Date.now() > new Date(config.deadline).getTime();
}

function getStats(registered) {
  return {
    limit: config.limit,
    registered: Math.min(registered, config.limit),
    remaining: Math.max(config.limit - registered, 0),
    percent: Math.min((registered / config.limit) * 100, 100),
    closed: isClosed(registered),
  };
}

function normalizePhone(phone) {
  const cleaned = String(phone || "").replace(/[^\d+]/g, "");
  let digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }

  if (digits.startsWith("8")) {
    digits = "62" + digits;
  }

  if (!digits.startsWith("62")) {
    return null;
  }

  const normalized = "+" + digits;
  return /^\+628\d{7,13}$/.test(normalized) ? normalized : null;
}

async function showForm(req, res, next) {
  try {
    const registered = await getRegisteredCount();
    res.render("index", {
      config,
      ...getStats(registered),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nomor WhatsApp ini sudah pernah melakukan konfirmasi." });
    }
    next(error);
  }
}

async function getRsvpStats(req, res, next) {
  try {
    const registered = await getRegisteredCount();
    res.json({
      ...getStats(registered),
      deadline: config.deadline,
    });
  } catch (error) {
    next(error);
  }
}

async function storeRsvp(req, res, next) {
  try {
    const name = String(req.body.name || "").trim().toUpperCase();
    const phone = normalizePhone(req.body.phone);
    const guestCount = Number(req.body.guestCount || 1);
    const note = String(req.body.note || "").trim();

    if (!name || !phone || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 6) {
      return res.status(400).json({ message: "Mohon lengkapi data dengan benar. Nomor WhatsApp harus format +62." });
    }

    const [existing] = await pool.query("SELECT id FROM rsvps WHERE phone = ? LIMIT 1", [phone]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Nomor WhatsApp ini sudah pernah melakukan konfirmasi." });
    }

    const registered = await getRegisteredCount();
    if (isClosed(registered)) {
      return res.status(409).json({ message: "Pendaftaran sudah ditutup." });
    }

    const remaining = config.limit - registered;
    if (guestCount > remaining) {
      return res.status(409).json({ message: `Maaf, sisa kuota hanya ${remaining} orang.` });
    }

    await pool.query(
      "INSERT INTO rsvps (name, phone, guest_count, note) VALUES (?, ?, ?, ?)",
      [name, phone, guestCount, note || null],
    );

    const nextRegistered = await getRegisteredCount();

    res.json({
      message: `Sampai jumpa di perayaan Natal, ${name}! Konfirmasi untuk ${guestCount} orang berhasil disimpan.`,
      stats: getStats(nextRegistered),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  showForm,
  getRsvpStats,
  storeRsvp,
};
