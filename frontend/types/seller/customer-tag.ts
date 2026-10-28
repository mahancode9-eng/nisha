export type CustomerTag = {
  id: number;
  store_id: number;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerTagCreate = {
  name: string;
  color?: string | null;
};

export type CustomerTagUpdate = {
  name?: string;
  color?: string | null;
};
