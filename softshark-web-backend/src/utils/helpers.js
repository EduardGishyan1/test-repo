/* eslint-disable no-shadow */
import logger from './logger.js';

/**
 * extracts desired primitive-value properties from an object, skips those that are not found
 * @param {Object} object
 * @param {string[]} properties
 * @returns {Object}
 */

export function extractExistingProperties(object, properties) {
  const derivedObject = {};
  if (!object || typeof object !== 'object') {
    return derivedObject;
  }
  if (properties?.length === 0) {
    return derivedObject;
  }
  properties.forEach((prop) => {
    if (Object.prototype.hasOwnProperty.call(object, prop)) {
      derivedObject[prop] = object[prop];
    }
  });
  return derivedObject;
}

/**
 * returns either parsed integer or null, if the argument is not parsable to int
 * @param {any} str
 * @returns {number|Array}
 */
export function parseInteger(str) {
  const parsedInt = parseInt(str, 10);
  return Number.isNaN(parsedInt) ? null : parsedInt;
}

// eslint-disable-next-line import/prefer-default-export
export function response(statusCode, body) {
  const { data = {}, error, ...responseDetails } = body;

  const responseConfig = {
    isBase64Encoded: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };

  let responseBody;

  if (error) {
    responseBody = {
      status: 'error',
      error,
      ...responseDetails,
    };

    logger.error({ responseBody, statusCode }, 'Bad request error!!!');
    return {
      statusCode,
      body: JSON.stringify(responseBody),
      ...responseConfig,
    };
  }

  responseBody = {
    status: 'success',
    data,
    ...responseDetails,
  };

  logger.info({ responseBody }, 'Successfully handled request!!!');
  return {
    statusCode,
    body: JSON.stringify(responseBody),
    ...responseConfig,
  };
}

export const buildUpdateExpression = (props) => {
  let exp = 'set ';
  const attrs = [];
  Object.keys(props).forEach((attr) => {
    attrs.push(`${attr} = :${attr}`);
  });
  exp += attrs.join(', ');
  return exp;
};

export const buildExpressionAttributeValues = (props) => {
  const exp = {};
  Object.entries(props).forEach((entry) => {
    const [key, value] = entry;
    exp[`:${key}`] = value;
  });
  return exp;
};
