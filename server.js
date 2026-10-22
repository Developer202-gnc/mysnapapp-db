
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Server və database bağlantısını yoxla
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      status: "error",
      database: "disconnected"
    });
  }
});

// Profil məlumatını saxla və ya yenilə
app.post("/api/profile", async (req, res) => {
  const { profileId, displayName } = req.body || {};

  if (
    typeof profileId !== "string" ||
    typeof displayName !== "string" ||
    !/^[a-zA-Z0-9_-]{1,64}$/.test(profileId) ||
    displayName.trim().length < 1 ||
    displayName.length > 100
  ) {
    return res.status(400).json({
      message: "Göndərilən məlumatlar düzgün deyil"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.app_profiles
         (profile_id, display_name, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (profile_id)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         updated_at = NOW()
       RETURNING profile_id, display_name, updated_at`,
      [profileId, displayName.trim()]
    );

    res.json({
      message: "Məlumat uğurla saxlanıldı",
      profile: result.rows[0]
    });
  } catch (error) {
    console.error("Database əməliyyatı uğursuz oldu:", error.message);

    res.status(500).json({
      message: "Server xətası"
    });
  }
});

// Demo login cəhdini qeyd et — parol saxlanılmır
app.post("/api/login-attempt", async (_req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO public.app_login_events (event_type, created_at)
       VALUES ($1, NOW())
       RETURNING id, event_type, created_at`,
      ["demo_login_failed"]
    );

    res.json({
      message: "Demo login xətası qeydə alındı",
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Test hadisəsi yazılmadı:", error.message);

    res.status(500).json({
      message: "Server xətası"
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`API port ${port}-da işləyir`);
});
