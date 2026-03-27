const Joi = require("joi");

const validate = (schemas) => (req, res, next) => {
  const targets = ["params", "query", "body"];

  for (const key of targets) {
    if (!schemas[key]) {
      continue;
    }

    const schema = Joi.object(schemas[key]);
    const { error, value } = schema.validate(req[key], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.error(`[validate] key=${key}`, error.details.map((d) => d.message));
      return res.status(400).json({
        success: false,
        message: "Validation error.",
        errors: error.details.map((item) => ({
          field: item.path.join("."),
          message: item.message,
        })),
      });
    }

    req[key] = value;
  }

  return next();
};

module.exports = validate;
