export function isValidCertKeyPair(
  cert: string,
  key: string,
  options?: {
    skipDateValidation?: boolean;
    domain?: string;
    bundle?: string;
    skipFormatValidation?: boolean;
    password?: string;
  },
): Promise<boolean>;

export function isValidCertToDomain(
  cert: string,
  domain: string,
  options?: {
    skipDateValidation?: boolean;
    key?: string;
    bundle?: string;
    skipFormatValidation?: boolean;
    password?: string;
  },
): Promise<boolean>;
