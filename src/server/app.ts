import express from "express";
import cors from "cors";
import routes from "./routes.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", routes);

// Serve frontend in production
const distPath = path.join(__dirname, "../../dist");
app.use(express.static(distPath));

app.get("*", (_, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Hook OS running on port ${PORT}`);
});
