const sendError = (res, status, code, message, details) => {
  const payload = {
    success: false,
    message,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
};

module.exports = {
  sendError,
};
