import { StatTile } from "@/components/ui/StatTile";

type StatCardProps = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  return <StatTile label={label} value={value} />;
}
