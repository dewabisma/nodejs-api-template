import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';

import env from '../config/index.js';

const googleClientId = env.google.clientId;
const googleClientSecret = env.google.clientSecret;
const googleCallbackURL = env.google.callbackUrl;

const strategyOptions = {
  clientID: googleClientId,
  clientSecret: googleClientSecret,
  callbackURL: googleCallbackURL,
};

const oauthVerificationHandler = (
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: VerifyCallback,
) => {
  return done(null, profile);
};

const googleOAuthStrategy = new GoogleStrategy(
  strategyOptions,
  oauthVerificationHandler,
);

export { googleOAuthStrategy };
