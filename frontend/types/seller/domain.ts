export type DomainStatus = "none" | "pending" | "verified" | "active";

export type DnsRecord = {
  type: "TXT" | "CNAME" | "A";
  name: string;
  value: string;
};

export type SellerDomain = {
  plan_enabled: boolean;
  hostname: string | null;
  status: DomainStatus;
  records: DnsRecord[];
  dns_pointing: boolean;
  verified_at: string | null;
  last_checked_at: string | null;
  last_error: string | null;
  url: string | null;
};
