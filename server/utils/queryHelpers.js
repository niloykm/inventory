/**
 * Query Helpers for Pagination, Filtering, and Sorting
 * International standard implementation with comprehensive options
 */

/**
 * Parse and build query options for MongoDB
 * @param {Object} query - Express request query object
 * @returns {Object} - Parsed options for pagination, filtering, sorting
 */
exports.parseQueryOptions = (query) => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    search = "",
    _t,
    flat,
    timestamp,
    cacheBust,
    ...filters
  } = query;

  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
  const skip = (parsedPage - 1) * parsedLimit;

  // Parse sort parameter (e.g., '-createdAt' for descending, 'name' for ascending)
  const sortObj = {};
  const sortFields = sort.split(",");
  sortFields.forEach((field) => {
    if (field.startsWith("-")) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
    sort: sortObj,
    search,
    filters,
  };
};

/**
 * Build search filter for text fields
 * @param {String} searchTerm - Search string
 * @param {Array} fields - Array of field names to search
 * @returns {Object} - MongoDB $or query
 */
exports.buildSearchFilter = (searchTerm, fields = []) => {
  if (!searchTerm || !fields.length) return {};

  const searchRegex = new RegExp(searchTerm, "i");
  return {
    $or: fields.map((field) => ({ [field]: searchRegex })),
  };
};

/**
 * Build filter object from query parameters
 * @param {Object} filters - Filter parameters
 * @returns {Object} - MongoDB filter object
 */
exports.buildFilterObject = (filters) => {
  const filterObj = {};

  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== "") {
      // Handle date ranges
      if (key === "startDate" || key === "start_date") {
        filterObj.createdAt = {
          ...filterObj.createdAt,
          $gte: new Date(filters[key]),
        };
      } else if (key === "endDate" || key === "end_date") {
        filterObj.createdAt = {
          ...filterObj.createdAt,
          $lte: new Date(filters[key]),
        };
      }
      // Handle numeric ranges
      else if (key.endsWith("_min")) {
        const field = key.replace("_min", "");
        filterObj[field] = {
          ...filterObj[field],
          $gte: parseFloat(filters[key]),
        };
      } else if (key.endsWith("_max")) {
        const field = key.replace("_max", "");
        filterObj[field] = {
          ...filterObj[field],
          $lte: parseFloat(filters[key]),
        };
      }
      // Handle array values (e.g., status=pending,approved)
      else if (typeof filters[key] === "string" && filters[key].includes(",")) {
        filterObj[key] = { $in: filters[key].split(",") };
      }
      // Direct match
      else {
        filterObj[key] = filters[key];
      }
    }
  });
  
  return filterObj;
};

/**
 * Build paginated response
 * @param {Array} data - Data array
 * @param {Number} total - Total count
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} - Paginated response
 */
exports.buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
};

/**
 * Complete query builder for common use case
 * @param {Model} Model - Mongoose model
 * @param {Object} query - Express request query
 * @param {Array} searchFields - Fields to search
 * @param {Object} populate - Fields to populate
 * @returns {Promise<Object>} - Paginated results
 */
exports.paginatedQuery = async (
  Model,
  query,
  searchFields = [],
  populate = null
) => {
  const { page, limit, skip, sort, search, filters } =
    exports.parseQueryOptions(query);

  // Build filter
  let filter = exports.buildFilterObject(filters);

  // Add search
  if (search && searchFields.length) {
    const searchFilter = exports.buildSearchFilter(search, searchFields);
    filter = { ...filter, ...searchFilter };
  }

  // Execute query
  let queryBuilder = Model.find(filter).sort(sort).skip(skip).limit(limit);

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach((p) => (queryBuilder = queryBuilder.populate(p)));
    } else {
      queryBuilder = queryBuilder.populate(populate);
    }
  }

  const [data, total] = await Promise.all([
    queryBuilder.exec(),
    Model.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Return flat structure expected by controllers
  return {
    data,
    total,
    page,
    pages: totalPages,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
};
