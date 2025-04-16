export const miniAppUrl = `https://capsula.dev/lovecraft.ai/`;

export const CLOUD_FUNCTIONS_BASE_URL =
  "https://us-central1-charmify-e7acc.cloudfunctions.net";

export const SUBSCRIPTION_WEBHOOK = `${CLOUD_FUNCTIONS_BASE_URL}/handleSuccessfulSubscription`;
export const LOG_SUBSCRIPTION_FAILURE_URL = `${CLOUD_FUNCTIONS_BASE_URL}/logSubscriptionFailure`;

export const SUBSCRIPTION_API_KEY = process.env.SUBSCRIPTION_API_KEY!;
