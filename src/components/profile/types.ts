export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  in_app: boolean;
}

export interface PrivacySettings {
  profile_visibility: string;
  portfolio_visibility: string;
}

export interface SocialLinks {
  [key: string]: string;
}