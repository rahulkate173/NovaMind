// ─────────────────────────────────────────────────────────────
//  routes/authRoutes.js  –  Google OAuth & JWT Authentication
// ─────────────────────────────────────────────────────────────

import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../config/config.js';
import { User } from '../models/User.model.js';

const router = express.Router();

// Configure Passport to use Google OAuth 2.0 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: '/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || profile._json?.email || `${profile.id}@google.com`;
        const displayName = profile.displayName || profile.name?.givenName || 'Learner';
        const photo = profile.photos?.[0]?.value || profile._json?.picture || '';

        // Find existing user in MongoDB by googleId or email
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (!user) {
          // Create and store new user in MongoDB
          user = await User.create({
            googleId: profile.id,
            displayName,
            email,
            photo,
          });
        } else if (!user.googleId) {
          // If user previously existed with this email, link their googleId
          user.googleId = profile.id;
          if (!user.photo && photo) user.photo = photo;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error('Error finding or creating user in MongoDB:', err);
        return done(err, null);
      }
    }
  )
);

// Route to initiate Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback route that Google will redirect to after authentication
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${config.frontendUrl}/login?error=auth_failed` }),
  (req, res) => {
    // req.user is the MongoDB User document returned by done(null, user)
    const userPayload = {
      id: req.user._id ? req.user._id.toString() : req.user.id,
      displayName: req.user.displayName || 'Learner',
      email: req.user.email || '',
      photo: req.user.photo || '',
    };

    const token = jwt.sign(userPayload, config.jwtSecret, { expiresIn: '7d' });

    // If browser navigation (normal OAuth redirect flow), redirect back to React frontend (/oauth-callback avoids Vite /auth proxy collision)
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const redirectUrl = new URL(`${config.frontendUrl}/oauth-callback`);
      redirectUrl.searchParams.set('token', token);
      redirectUrl.searchParams.set('id', userPayload.id);
      redirectUrl.searchParams.set('displayName', userPayload.displayName);
      redirectUrl.searchParams.set('photo', userPayload.photo);
      redirectUrl.searchParams.set('email', userPayload.email);
      return res.redirect(redirectUrl.toString());
    }

    // Send the token to the client (for API calls / reference code compliance)
    res.json({ token, user: userPayload });
  }
);

// Quick endpoint to verify or get current user info with JWT
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found in DB' });
    }
    res.json({
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
        photo: user.photo,
      },
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
