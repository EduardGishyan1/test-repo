const Joi = require('joi');

const createBlogPostSchema = Joi.object({
  title: Joi.string().min(3).max(100)
    .required(),

  short_description: Joi.string().min(3).max(200).required(),

  thumbnail: Joi.string().min(3).max(1000).required(),

  content: Joi.string().min(3).required(),

  keywords: Joi.string().min(3).required(),
});

const updateBlogPostSchema = Joi.object({
  title: Joi.string().min(3).max(100),

  short_description: Joi.string().min(3).max(200),

  thumbnail: Joi.string().min(3).max(1000),

  content: Joi.string().min(3),

  keywords: Joi.string().min(3).required(),
});

export default { createBlogPostSchema, updateBlogPostSchema };
