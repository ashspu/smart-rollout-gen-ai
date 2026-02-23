/**
 * Extracts auth context from Cognito JWT claims passed by API Gateway.
 * Returns tenantId, userId, and email for use in handlers.
 */
function getAuthContext(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims?.sub) {
    return { tenantId: 'default', userId: 'anonymous', email: 'unknown' };
  }
  return {
    tenantId: claims['custom:tenantId'] || claims.sub,
    userId: claims.sub,
    email: claims.email || 'unknown',
  };
}

module.exports = { getAuthContext };
