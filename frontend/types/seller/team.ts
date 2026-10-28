export type StoreMember = {
  id: number;
  store_id: number;
  email: string;
  user_id: number | null;
  role: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreMemberCreate = {
  email: string;
  role?: string;
};

export type StoreActionLog = {
  id: number;
  store_id: number;
  actor_user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  note: string | null;
  created_at: string;
};
