export const defineConfigurableField = (
  target: object,
  propertyKey: PropertyKey,
  propertyValue: any,
) => {
  return Object.defineProperty(target, propertyKey, {
    value: propertyValue,
    enumerable: false,
    configurable: false,
  })
}
