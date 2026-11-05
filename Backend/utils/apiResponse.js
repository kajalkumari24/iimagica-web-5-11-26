export const successResponse = (
  res,
  data,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res,
  message = "Error",
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const paginatedResponse = (
  res,
  data,
  pagination,
  message = "Success"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

// Compatibility helper for old controllers
export const apiResponse = (
  res,
  statusCode,
  message,
  data = null
) => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
  });
};