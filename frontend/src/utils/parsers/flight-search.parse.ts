import { string, z } from 'zod';

const baseSearchSchema = z.object({
  from_id: z.string(),
  from_type: z.enum(['city', 'airport']),
  departure_date: z.string(),
  return_date: z.string().optional(),
});

const baseValidation = (data: any, ctx: z.RefinementCtx) => {
  const isSpecific = !data.date_type || data.date_type === 'specific';

  if (isSpecific) {
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(data.departure_date)) {
      ctx.addIssue({
        path: ['departure_date'],
        code: z.ZodIssueCode.custom,
        message:
          'departure_date must be in dd-mm-yyyy format when date_type is specific or missing',
      });
    }
    if (data.return_date && !dateRegex.test(data.return_date)) {
      ctx.addIssue({
        path: ['return_date'],
        code: z.ZodIssueCode.custom,
        message:
          'return_date must be in dd-mm-yyyy format when date_type is specific or missing',
      });
    }
  } else {
    const dateRegex = /^\d{2}-\d{4}$/;
    if (!dateRegex.test(data.departure_date)) {
      ctx.addIssue({
        path: ['departure_date'],
        code: z.ZodIssueCode.custom,
        message:
          'departure_date must be in mm-yyyy format when date_type is flexible',
      });
    }
    if (data.return_date && !dateRegex.test(data.return_date)) {
      ctx.addIssue({
        path: ['return_date'],
        code: z.ZodIssueCode.custom,
        message:
          'return_date must be in mm-yyyy format when date_type is flexible',
      });
    }
  }
};

const genericSearchSchema = baseSearchSchema
  .extend({
    to_type: z.enum(['nation', 'city', 'airport', 'anywhere']),
    to_id: z.string().optional(),
    date_type: z.enum(['flexible', 'specific']),
  })
  .superRefine((data, ctx) => {
    if (data.to_type !== 'anywhere' && data.to_id === undefined) {
      ctx.addIssue({
        path: ['to_id'],
        code: z.ZodIssueCode.custom,
        message: 'to_id must be a numeric string if to_type is not "anywhere"',
      });
    }
    baseValidation(data, ctx);
  });

const countrySearchSchema = baseSearchSchema
  .extend({
    to_type: z.literal('anywhere'),
    date_type: z.enum(['flexible', 'specific']),
  })
  .superRefine(baseValidation);

const citySearchSchema = baseSearchSchema
  .extend({
    to_type: z.literal('nation'),
    to_id: z.string(),
    date_type: z.enum(['flexible', 'specific']),
  })
  .superRefine(baseValidation);

const dateSearchSchema = baseSearchSchema
  .extend({
    to_type: z.enum(['city', 'airport']),
    to_id: z.string(),
    date_type: z.literal('flexible'),
  })
  .superRefine(baseValidation);

const flightSearchSchema = baseSearchSchema.extend({
  to_type: z.enum(['city', 'airport']),
  to_id: z.string(),
});

export function parseGenericFlightSearchParams(
  params: any
): z.infer<typeof genericSearchSchema> {
  const result = genericSearchSchema.safeParse(params);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

type Keys<T> = T extends any ? keyof T : never;
type CommonKeys<T> = {
  [K in Keys<T>]: [T] extends [{ [P in K]-?: unknown }] ? K : never;
}[Keys<T>];
type PropType<T, K extends PropertyKey> = T extends any
  ? K extends keyof T
    ? T[K]
    : never
  : never;
type MergeOptional<T> = {
  [K in CommonKeys<T>]: PropType<T, K>;
} & {
  [K in Exclude<Keys<T>, CommonKeys<T>>]?: PropType<T, K>;
};

type SearchParams = MergeOptional<
  | z.infer<typeof countrySearchSchema>
  | z.infer<typeof citySearchSchema>
  | z.infer<typeof dateSearchSchema>
  | z.infer<typeof flightSearchSchema>
>;





export function parseSpecificFlightSearchParams(
  params: any,
  type: 'nation' | 'city' | 'dates' | 'flights'
): SearchParams {
  let result;
  switch (type) {
    case 'nation':
      result = countrySearchSchema.safeParse(params);
      break;
    case 'city':
      result = citySearchSchema.safeParse(params);
      break;
    case 'dates':
      result = dateSearchSchema.safeParse(params);
      break;
    case 'flights':
      result = flightSearchSchema.safeParse(params);
      break;
    default:
      throw new Error(`Invalid search type: ${type}`);
  }
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}
