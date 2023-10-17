export const AUTHORIZATION_KEY = 'loopback:authorization';

export function implementsAuthorization() {
  return (target: object) => {
    Reflect.defineMetadata(AUTHORIZATION_KEY, true, target);
  };
}
