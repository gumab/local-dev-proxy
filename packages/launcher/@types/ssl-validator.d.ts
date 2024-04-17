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
