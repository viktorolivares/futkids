export interface SunatConfigOptions {
  env: 'BETA' | 'PRODUCTION';
  serviceUrl: string;
  username: string; // RUC + SOL User (e.g. 20000000001MODDATOS)
  password: string; // SOL Password (e.g. moddatos)
  ruc: string;
  solUser: string;
  certificatePath?: string;
  certificatePassword?: string;
  certificatePem?: string;
  timeoutMs: number;
}

export const SUNAT_DEFAULTS = {
  BETA_URL: 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
  PRODUCTION_URL: 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService',
  TEST_RUC: '20000000001',
  TEST_SOL_USER: 'MODDATOS',
  TEST_SOL_PASS: 'moddatos',
  TIMEOUT_MS: 30000,
};

export function getSunatConfig(overrides?: Partial<SunatConfigOptions>): SunatConfigOptions {
  const envRaw = (
    overrides?.env ||
    process.env.SUNAT_ENV ||
    'BETA'
  ).toUpperCase();

  const env = envRaw === 'PRODUCTION' || envRaw === 'PROD' ? 'PRODUCTION' : 'BETA';

  const defaultUrl =
    env === 'PRODUCTION'
      ? process.env.SUNAT_PRODUCTION_URL || SUNAT_DEFAULTS.PRODUCTION_URL
      : process.env.SUNAT_BETA_URL || SUNAT_DEFAULTS.BETA_URL;

  const ruc = overrides?.ruc || process.env.SUNAT_RUC || SUNAT_DEFAULTS.TEST_RUC;
  const solUser =
    overrides?.solUser ||
    process.env.SUNAT_USERNAME ||
    process.env.SUNAT_SOL_USER ||
    SUNAT_DEFAULTS.TEST_SOL_USER;

  const password =
    overrides?.password ||
    process.env.SUNAT_PASSWORD ||
    process.env.SUNAT_SOL_PASS ||
    SUNAT_DEFAULTS.TEST_SOL_PASS;

  // SUNAT requires the username to be formatted as: RUC + SOL_USER
  const fullUsername = solUser.startsWith(ruc) ? solUser : `${ruc}${solUser}`;

  return {
    env,
    serviceUrl: overrides?.serviceUrl || defaultUrl,
    ruc,
    solUser,
    username: fullUsername,
    password,
    certificatePath: overrides?.certificatePath || process.env.SUNAT_CERTIFICATE_PATH,
    certificatePassword:
      overrides?.certificatePassword || process.env.SUNAT_CERTIFICATE_PASSWORD,
    certificatePem: overrides?.certificatePem,
    timeoutMs: overrides?.timeoutMs || Number(process.env.SUNAT_TIMEOUT_MS) || SUNAT_DEFAULTS.TIMEOUT_MS,
  };
}
