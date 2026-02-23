const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Client-Request-Id',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

exports.success = (body, statusCode = 200) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

exports.error = (message, statusCode = 500) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify({ error: message }),
});
