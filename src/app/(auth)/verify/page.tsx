import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifyForm } from "@/features/auth/components/VerifyForm";

export default function VerifyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor verification</CardTitle>
        <CardDescription>Enter the 6-digit code from your authenticator.</CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyForm />
      </CardContent>
    </Card>
  );
}
