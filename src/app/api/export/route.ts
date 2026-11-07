import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { findAllTransactions } from "@/server/repositories/transactions";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await findAllTransactions(session.user.id);

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  if (format === "json") {
    const payload = rows.map((transaction) => ({
      id: transaction.id,
      date: transaction.date.toISOString().slice(0, 10),
      desc: transaction.desc,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      loanId: transaction.loanId,
    }));
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="coffer-ledger.json"',
      },
    });
  }

  const header = ["date", "desc", "amount", "type", "category", "loan_id"];
  const lines = [
    header.join(","),
    ...rows.map((transaction) =>
      [
        transaction.date.toISOString().slice(0, 10),
        transaction.desc,
        transaction.amount.toString(),
        transaction.type,
        transaction.category ?? "",
        transaction.loanId ?? "",
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="coffer-ledger.csv"',
    },
  });
}
