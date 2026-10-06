import { execSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { GenericContainer, Wait } from "testcontainers";
import { TEST_DB_URL_FILE } from "./db-url";

export default async function globalSetup() {
  const container = await new GenericContainer("postgres:16-alpine")
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "postgres",
      POSTGRES_DB: "coffer",
    })
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 1))
    .start();

  const url = `postgresql://postgres:postgres@${container.getHost()}:${container.getMappedPort(
    5432,
  )}/coffer`;

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    stdio: "inherit",
  });

  writeFileSync(TEST_DB_URL_FILE, url);

  return async () => {
    await container.stop();
    rmSync(TEST_DB_URL_FILE, { force: true });
  };
}
