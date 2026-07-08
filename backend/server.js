require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const { reviewScreen } = require("./services/openai");

// health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "Figma UX Audit AI"
  });
});

app.post("/review", async (req, res) => {
  try {
    console.log("\n========== NEW REVIEW REQUEST ==========");
    console.log("Timestamp:", new Date().toISOString());

    const payload = req.body;

    if (!payload || !payload.selectedNode) {
      return res.status(400).json({
        error: "Invalid payload: selectedNode is required"
      });
    }

    console.log("Frame received:");
    console.log(payload.selectedNode?.name);

    const result = await reviewScreen(payload);

    console.log("\n========== AI RESULT ==========");
    console.log(result);

    res.json({
      success: true,
      review: result
    });

  } catch (error) {
    console.error("ERROR /review:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// global error handler (optional tapi bagus)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Unexpected error"
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});