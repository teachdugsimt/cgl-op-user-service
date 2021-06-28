import Utility from 'utility-layer/dist/security';

const utility = new Utility();

const ValidateEncodeIdFormat = (userId?: any) => (
  target: Object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<any>
) => {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any) {
    const result = originalMethod.apply(this, args);

    const [request] = [...args]

    const newUserId = userId ?? request.params.userId;

    if (!utility.matchEncryptId(newUserId)) {
      throw new Error('UserId must be an encoded string');
    }

    return result;
  };

  return descriptor;
};

export default ValidateEncodeIdFormat
