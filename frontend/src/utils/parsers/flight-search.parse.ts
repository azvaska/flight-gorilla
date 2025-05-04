import { z } from 'zod';

const locationSchema = z
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
    if (data.to_type !== 'anywhere' 
        && data.to_id === undefined
      // && !data.to_id?.match(/^\d+$/) TODO: Implement in future where id type is known
    ) {
      ctx.addIssue({
        path: ['to_id'],
        code: z.ZodIssueCode.custom,
        message: 'to_id must be a numeric string if to_type is not "anywhere"',
      });
    }
  });

export function parseFlightSearchParams(
  params: any
): z.infer<typeof locationSchema> {
  const result = locationSchema.safeParse(params);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}
