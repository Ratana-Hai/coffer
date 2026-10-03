export interface CategoryDefinition {
  key: string;
  label: string;
  slot: number;
}

export const categories: CategoryDefinition[] = [
  { key: "food", label: "Food & Dining", slot: 0 },
  { key: "transport", label: "Transport", slot: 1 },
  { key: "housing", label: "Housing", slot: 2 },
  { key: "utilities", label: "Utilities", slot: 3 },
  { key: "entertainment", label: "Entertainment", slot: 4 },
  { key: "health", label: "Health", slot: 5 },
  { key: "shopping", label: "Shopping", slot: 6 },
  { key: "loan", label: "Loan payments", slot: 7 },
  { key: "other", label: "Other", slot: 8 },
];

export function categoryFor(key: string | null | undefined): CategoryDefinition {
  return categories.find((category) => category.key === key) ?? categories[8];
}
