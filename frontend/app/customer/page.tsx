import { redirect } from "next/navigation";
import { paths } from "@/lib/auth/paths";

export default function CustomerRootPage() {
  redirect(paths.customer.dashboard);
}
