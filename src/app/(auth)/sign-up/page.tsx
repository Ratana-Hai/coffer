import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Two fields. That&apos;s all we need.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <p className="px-6 pb-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
