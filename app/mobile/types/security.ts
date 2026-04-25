export interface SecuritySettings {
  biometricLockEnabled: boolean;
}

export interface SignedActionPrompt {
  title: string;
  description: string;
  riskLabel: string;
  details?: string[];
  acknowledgementText?: string;
}

export type SecurityAuthReason =
  | "app_unlock"
  | "payment_authorization"
  | "sensitive_data_access";
