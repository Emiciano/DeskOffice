const parsedPort = Number(process.env.API_PORT);
export const APP_PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 4000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
export const DEFAULT_COMPANY_NAME = process.env.DEFAULT_COMPANY_NAME ?? "Default Company";
