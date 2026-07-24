export type AdminPlatformSettings = {
  guest_checkout_enabled: boolean;
  subscription_card_number: string;
  subscription_card_owner: string;
  subscription_card_bank: string;
};

export type AdminPlatformSettingsUpdate = {
  guest_checkout_enabled?: boolean;
  subscription_card_number?: string;
  subscription_card_owner?: string;
  subscription_card_bank?: string;
};
