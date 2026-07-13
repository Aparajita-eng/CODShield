import { redirect } from "next/navigation";

export default function FraudEventsRedirectPage() {
  redirect("/dashboard/fraud-center");
}
