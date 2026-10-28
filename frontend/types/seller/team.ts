export type StoreRole = "owner" | "order_manager" | "product_manager";

export type TeamMemberStatus = "PENDING" | "ACTIVE" | "REVOKED";

export type TeamMember = {
  id: number | null;
  email: string;
  full_name: string | null;
  role: StoreRole;
  status: TeamMemberStatus;
  is_store_owner: boolean;
  invited_at: string | null;
  accepted_at: string | null;
  invite_expires_at: string | null;
};

export type TeamInvite = TeamMember & { accept_url: string };

export type TeamOverview = {
  enabled: boolean;
  /** Staff seats on the plan; null = unlimited. */
  seats: number | null;
  members: TeamMember[];
};

export type MyStore = {
  store_id: number;
  name: string;
  slug: string;
  role: StoreRole;
  is_store_owner: boolean;
};

export type TeamAuditEntry = {
  id: number;
  actor_name: string;
  actor_role: string;
  action: string;
  order_id: number | null;
  order_invoice: string | null;
  details: string | null;
  created_at: string;
};
