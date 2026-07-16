export function encodeBase64UrlJson<TValue>(value: TValue): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function decodeBase64UrlJson<TValue>(payload: string): TValue {
  return JSON.parse(
    Buffer.from(payload, 'base64url').toString('utf8'),
  ) as TValue;
}
