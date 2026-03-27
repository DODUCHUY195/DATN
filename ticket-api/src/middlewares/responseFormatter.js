const responseFormatter = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (!req.path.startsWith("/api") || body === null || body === undefined) {
      return originalJson(body);
    }

    if (typeof body !== "object" || Array.isArray(body)) {
      return originalJson({ success: true, message: "Success", data: body });
    }

    if (Object.prototype.hasOwnProperty.call(body, "success")) {
      return originalJson(body);
    }

    const formatted = {
      success: true,
      message: body.message || "Success",
      data: Object.prototype.hasOwnProperty.call(body, "data")
        ? body.data
        : body,
      meta: body.meta || undefined,
    };

    return originalJson(formatted);
  };

  next();
};

module.exports = responseFormatter;
