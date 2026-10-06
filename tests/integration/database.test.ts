import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db";

describe("database", () => {
  it("applies the migration and exposes the expected tables", async () => {
    const rows = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT table_name AS name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const names = rows.map((row) => row.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "users",
        "transactions",
        "budgets",
        "goals",
        "loans",
        "preferences",
        "authenticators",
      ]),
    );
  });
});
