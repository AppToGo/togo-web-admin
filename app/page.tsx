import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to login page
  // In the future, this could check auth and redirect to dashboard if logged in
  redirect("/login");
}
