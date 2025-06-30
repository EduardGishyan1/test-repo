import Joi from 'joi';

const schema = Joi.object({
  title: Joi
    .string()
    .min(3)
    .max(30)
    .required(),
  description: Joi
    .string()
    .min(3)
    .required(),
  seniority: Joi
    .string()
    .min(3)
    .max(30)
    .required(),
  slug: Joi
    .string()
    .min(3)
    .max(30)
    .required(),
  deadline: Joi
    .date()
    .iso(),
});

export const updateJobPostingSchema = Joi.object({
  title: Joi
    .string()
    .min(3)
    .max(30),
  description: Joi
    .string()
    .min(3),
  seniority: Joi
    .string()
    .min(3)
    .max(30),
  slug: Joi
    .string()
    .min(3)
    .max(30),
  deadline: Joi
    .date()
    .iso(),
  published: Joi
    .boolean()
    .optional(),
});

export default schema;
