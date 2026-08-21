export interface IEntitlementFeatures {
  profileCreate: boolean;
  shareableProfile: boolean;
  removeBranding: boolean;
  aiTone: boolean;
  visitorAnalytics: boolean;
  higherLlmModel: boolean;
}

export interface IEntitlementLimits {
  aiMessagesPerMonth: number | null;
}

export interface IEntitlements {
  features: IEntitlementFeatures;
  limits: IEntitlementLimits;
}

export interface IBillingPlanInfo {
  code: string;
  name: string;
  description?: string;
  version?: number;
}

export interface IBillingStateResponse {
  plan: IBillingPlanInfo;
  status: "FREE" | "ACTIVE" | "EXPIRED";
  price?: number;
  currency?: string;
  startedAt?: Date | string;
  expiresAt?: Date | string;
  entitlements: IEntitlements;
}

export interface ICashfreeCustomerDetails {
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface ICashfreeCreateOrderRequest {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: ICashfreeCustomerDetails;
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
}

export interface ICashfreeOrderResponse {
  cf_order_id?: string;
  order_id: string;
  entity?: string;
  order_currency: string;
  order_amount: number;
  order_status: string;
  payment_session_id?: string;
  order_expiry_time?: string;
}

export interface ICashfreeWebhookPayload {
  data?: {
    order?: {
      order_id: string;
      order_amount: number;
      order_currency: string;
    };
    payment?: {
      cf_payment_id?: string | number;
      payment_status: string;
      payment_amount?: number;
      payment_currency?: string;
      payment_message?: string;
      payment_time?: string;
      bank_reference?: string;
      payment_group?: string;
      payment_method?: any;
    };
    customer_details?: {
      customer_id?: string;
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
    };
  };
  event_time?: string;
  type?: string;
}
