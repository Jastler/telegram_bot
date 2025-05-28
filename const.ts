export const miniAppUrl = `https://charmify-e7acc.web.app/`;

export const CLOUD_FUNCTIONS_BASE_URL =
  "https://us-central1-charmify-e7acc.cloudfunctions.net";

export const SUBSCRIPTION_WEBHOOK = `${CLOUD_FUNCTIONS_BASE_URL}/handleSuccessfulSubscription`;
export const STARS_WEBHOOK = `${CLOUD_FUNCTIONS_BASE_URL}/handleSuccessfulStarsPurchase`;
export const LOG_SUBSCRIPTION_FAILURE_URL = `${CLOUD_FUNCTIONS_BASE_URL}/logSubscriptionFailure`;

export const SUBSCRIPTION_API_KEY = process.env.SUBSCRIPTION_API_KEY!;
