export const deepConvertMapToObject = (data: any): any => {
    if (data instanceof Map) {
      return Object.fromEntries(
        Array.from(data.entries()).map(([key, value]) => [key, deepConvertMapToObject(value)])
      );
    } else if (Array.isArray(data)) {
      return data.map(deepConvertMapToObject);
    } else if (typeof data === 'object' && data !== null) {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, deepConvertMapToObject(value)])
      );
    }
    return data;
  };