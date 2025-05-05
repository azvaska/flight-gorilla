import { z } from 'zod';

const genericSearchSchema = z
  .object({
    from_type: z.enum(['city', 'airport']),
    from_id: z.string(),
    to_type: z.enum(['country', 'city', 'airport', 'anywhere']),
    to_id: z.string(),
    departure_date: z.string(),
    return_date: z.string(),
    date_type: z.enum(['flexible', 'specific']),
  })
  .superRefine((data, ctx) => {
    if (
      data.to_type !== 'anywhere' &&
      data.to_id === undefined
      // && !data.to_id?.match(/^\d+$/) TODO: Implement in future where id type is known
    ) {
      ctx.addIssue({
        path: ['to_id'],
        code: z.ZodIssueCode.custom,
        message: 'to_id must be a numeric string if to_type is not "anywhere"',
      });
    }
  });

const countrySearchSchema = z.object({
  from_type: z.enum(['city', 'airport']),
  from_id: z.string(),
  departure_date: z.string(),
  return_date: z.string(),
  date_type: z.enum(['flexible', 'specific']),
});

const citySearchSchema = countrySearchSchema.extend({
  to_id: z.string(),
});

const dateSearchSchema = z.object({
  from_type: z.enum(['city', 'airport']),
  from_id: z.string(),
  to_type: z.enum(['city', 'airport']),
  to_id: z.string(),
  departure_date: z.number().int().min(1).max(12),
  return_date: z.number().int().min(1).max(12),
});

const flightSearchSchema = z.object({
  from_type: z.enum(['city', 'airport']),
  from_id: z.string(),
  to_type: z.enum(['city', 'airport']),
  to_id: z.string(),
  departure_date: z.string(),
  return_date: z.string(),
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

export function parseSpecificFlightSearchParams(
  params: any,
  type: 'country' | 'city' | 'dates' | 'flights'
):
  | z.infer<typeof countrySearchSchema>
  | z.infer<typeof citySearchSchema>
  | z.infer<typeof dateSearchSchema>
  | z.infer<typeof flightSearchSchema> {
  let result;
  switch (type) {
    case 'country':
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
