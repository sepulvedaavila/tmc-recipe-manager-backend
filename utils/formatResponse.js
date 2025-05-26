/**
 * Utility function to format standardized API responses
 */

/**
 * Success response formatter
 * @param {Object} data - The data to return
 * @param {String} message - Optional success message
 * @param {Number} statusCode - HTTP status code
 * @returns {Object} Formatted response object
 */
exports.success = (data, message = 'Operation successful', statusCode = 200) => ({
  success: true,
  statusCode,
  message,
  data
});

/**
 * Error response formatter
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} error - Optional error details
 * @returns {Object} Formatted error response
 */
exports.error = (message = 'An error occurred', statusCode = 500, error = null) => ({
  success: false,
  statusCode,
  message,
  error: process.env.NODE_ENV === 'development' ? error : undefined
});

/**
 * Pagination formatter
 * @param {Array} data - The paginated data
 * @param {Number} total - Total number of records
 * @param {Number} page - Current page number
 * @param {Number} limit - Number of records per page
 * @returns {Object} Formatted paginated response
 */
exports.paginated = (data, total, page = 1, limit = 10) => ({
  data,
  pagination: {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit))
  }
});