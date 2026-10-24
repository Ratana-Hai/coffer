import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyRequestPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>We sent you a sign-in link.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted">
          Open the link to sign in to Coffer. In development, the link is logged
          to the server console.
        </p>
      </CardContent>
    </Card>
  );
}
