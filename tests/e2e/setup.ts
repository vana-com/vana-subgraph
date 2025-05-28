import { config } from "dotenv";
import path from "path";

// Load environment variables from tests/e2e/.env
config({
  path: path.resolve(__dirname, ".env"),
});
