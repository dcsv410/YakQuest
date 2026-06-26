const DEV_API = "http://127.0.0.1:8010";
const PROD_API = "https://api.yakquest.com";

export const API_URL = import.meta.env.DEV ? DEV_API : PROD_API;

export const APP_NAME = "YakQuest";
export const TAGLINE = "PLAN • PADDLE • EXPLORE";