import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ;
const GOOGLE_CALLBACK_PATH = process.env.GOOGLE_CALLBACK_PATH ;

// Initialize Google Strategy
const initializeGoogleStrategy = () => {
  const callbackUrl = `${BACKEND_ORIGIN}${GOOGLE_CALLBACK_PATH}`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackUrl,
        proxy: true,
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : "";
          const image = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "";
          const user = {
            id: profile.id,
            name: profile.displayName,
            email: email,
            image: image,
          };

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};

// session handle
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

export { initializeGoogleStrategy };
export default passport;