// Development
const DEV_API = "http://10.0.0.14:8010";

// Production
const PROD_API = "https://api.yakquest.com";

export const API_URL = __DEV__
  ? DEV_API
  : PROD_API;