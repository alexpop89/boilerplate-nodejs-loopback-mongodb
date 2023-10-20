export const AUTHORIZATION_KEY = 'loopback:authorization';

export function implementsAuthorization() {
  return function (
    target: Object, // The prototype of the class
    propertyKey: string | symbol, // The name of the method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    Reflect.defineMetadata(AUTHORIZATION_KEY, true, target, propertyKey);
  };
}
