import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@coffer.local";

function at(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: DEMO_EMAIL,
      onboarded: true,
      preferences: {
        create: {
          currencyCode: "KHR",
          customSymbol: null,
          decimals: 0,
          position: "suffix",
          themeAccent: "#3b82f6",
          themeBase: "neutral",
          themeMode: "system",
        },
      },
    },
  });

  const expenses: Array<[string, string, string, string]> = [
    ["2026-10-02", "Lunch at the market", "150000", "food"],
    ["2026-10-03", "Tuk-tuk home", "50000", "transport"],
    ["2026-10-04", "Rent", "800000", "housing"],
    ["2026-10-05", "Electricity", "120000", "utilities"],
    ["2026-10-06", "Cinema tickets", "40000", "entertainment"],
    ["2026-10-07", "Clinic visit", "60000", "health"],
    ["2026-10-08", "New shoes", "90000", "shopping"],
    ["2026-09-15", "Salary", "2000000", "income"],
    ["2026-09-16", "Groceries", "180000", "food"],
    ["2026-09-17", "Petrol", "70000", "transport"],
    ["2026-09-18", "Dinner out", "60000", "food"],
    ["2026-08-15", "Salary", "2000000", "income"],
    ["2026-08-16", "Groceries", "170000", "food"],
    ["2026-08-17", "Rent", "800000", "housing"],
  ];

  const transactions = expenses.map(([date, desc, amount, typeOrCategory]) => ({
    userId: user.id,
    date: at(date),
    desc,
    amount: new Prisma.Decimal(amount),
    type: typeOrCategory === "income" ? ("income" as const) : ("expense" as const),
    category: typeOrCategory === "income" ? null : typeOrCategory,
  }));

  await prisma.transaction.createMany({ data: transactions });

  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryKey: "food", monthlyLimit: new Prisma.Decimal("200000") },
      { userId: user.id, categoryKey: "transport", monthlyLimit: new Prisma.Decimal("80000") },
    ],
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      name: "Emergency fund",
      target: new Prisma.Decimal("5000000"),
      saved: new Prisma.Decimal("1000000"),
    },
  });

  console.log(`Seeded demo user ${user.id} with a KHR ledger.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
