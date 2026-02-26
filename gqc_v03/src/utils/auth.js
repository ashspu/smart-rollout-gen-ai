let cognitoModule = null;

async function loadCognito() {
  if (cognitoModule) return cognitoModule;
  try {
    cognitoModule = await import('amazon-cognito-identity-js');
    return cognitoModule;
  } catch (e) {
    console.warn('Cognito SDK not available, auth disabled:', e.message);
    return null;
  }
}

const POOL_DATA = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

let userPool = null;
async function getPool() {
  if (!POOL_DATA.UserPoolId || !POOL_DATA.ClientId) return null;
  if (userPool) return userPool;
  const sdk = await loadCognito();
  if (!sdk) return null;
  userPool = new sdk.CognitoUserPool(POOL_DATA);
  return userPool;
}

/**
 * Sign in with email + password.
 * Returns { idToken, accessToken, refreshToken, email } on success.
 * Throws { code: 'NEW_PASSWORD_REQUIRED', cognitoUser } if first login.
 */
export async function signIn(email, password) {
  const sdk = await loadCognito();
  const pool = await getPool();
  if (!pool || !sdk) throw new Error('Cognito not configured');

  const cognitoUser = new sdk.CognitoUser({ Username: email, Pool: pool });
  const authDetails = new sdk.AuthenticationDetails({ Username: email, Password: password });

  return new Promise((resolve, reject) => {
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
export async function getCurrentSession() {
  const pool = await getPool();
  if (!pool) return null;

  const user = pool.getCurrentUser();
  if (!user) return null;

  return new Promise((resolve) => {
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
export async function signOut() {
  const pool = await getPool();
  if (!pool) return;
  const user = pool.getCurrentUser();
  if (user) user.signOut();
}

/**
 * Synchronous check: is there a current user in local storage?
 */
export function isAuthenticated() {
  return !!userPool?.getCurrentUser();
}
