import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';

const POOL_DATA = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

let userPool = null;
function getPool() {
  if (!userPool && POOL_DATA.UserPoolId && POOL_DATA.ClientId) {
    userPool = new CognitoUserPool(POOL_DATA);
  }
  return userPool;
}

/**
 * Sign in with email + password.
 * Returns { idToken, accessToken, refreshToken, email } on success.
 * Throws { code: 'NEW_PASSWORD_REQUIRED', cognitoUser } if first login.
 */
export function signIn(email, password) {
  return new Promise((resolve, reject) => {
    const pool = getPool();
    if (!pool) return reject(new Error('Cognito not configured'));

    const cognitoUser = new CognitoUser({ Username: email, Pool: pool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess(session) {
        resolve({
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
          email: session.getIdToken().payload.email,
        });
      },
      onFailure(err) {
        reject(err);
      },
      newPasswordRequired(userAttributes) {
        // First login — admin-created user must set a new password
        const err = new Error('New password required');
        err.code = 'NEW_PASSWORD_REQUIRED';
        err.cognitoUser = cognitoUser;
        err.userAttributes = userAttributes;
        reject(err);
      },
    });
  });
}

/**
 * Complete the NEW_PASSWORD_REQUIRED challenge.
 */
export function completeNewPassword(cognitoUser, newPassword) {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess(session) {
        resolve({
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
          email: session.getIdToken().payload.email,
        });
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

/**
 * Get the current session (auto-refreshes if expired).
 * Returns { idToken, email } or null if not authenticated.
 */
export function getCurrentSession() {
  return new Promise((resolve) => {
    const pool = getPool();
    if (!pool) return resolve(null);

    const user = pool.getCurrentUser();
    if (!user) return resolve(null);

    user.getSession((err, session) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve({
        idToken: session.getIdToken().getJwtToken(),
        email: session.getIdToken().payload.email,
      });
    });
  });
}

/**
 * Sign out — clears local tokens.
 */
export function signOut() {
  const pool = getPool();
  if (!pool) return;
  const user = pool.getCurrentUser();
  if (user) user.signOut();
}

/**
 * Synchronous check: is there a current user in local storage?
 */
export function isAuthenticated() {
  const pool = getPool();
  return !!pool?.getCurrentUser();
}
