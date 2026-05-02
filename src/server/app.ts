import express from "express";
import cors from "cors";
import routes from "./routes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", routes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Hook OS running on http://localhost:${PORT}`);
});
