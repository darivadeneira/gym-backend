import { ValueTransformer } from 'typeorm';

export const DecimalTransformer: ValueTransformer = {
  to: (value: number | null): number | null => {
    return value;
  },
  from: (value: string | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return parseFloat(value);
  },
};
