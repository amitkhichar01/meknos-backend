import "./config/env.config.ts";
import app from "./app.ts";
import connectDB from "./config/db.config.ts";
import { env } from "./config/env.config.ts";

const PORT = env.PORT;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
};

startServer();
