import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/features/auth/components/SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>We&apos;ll email you a magic link.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm next={next} />
      </CardContent>
      <p className="px-6 pb-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/sign-up" className="text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
