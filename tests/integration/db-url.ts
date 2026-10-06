import { tmpdir } from "node:os";
import path from "node:path";

export const TEST_DB_URL_FILE = path.join(tmpdir(), "coffer-test-db-url");
