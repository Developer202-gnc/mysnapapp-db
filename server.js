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