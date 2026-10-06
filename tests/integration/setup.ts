import { readFileSync } from "node:fs";
import { TEST_DB_URL_FILE } from "./db-url";

const url = readFileSync(TEST_DB_URL_FILE, "utf8");
process.env.TEST_DATABASE_URL = url;
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
