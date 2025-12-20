import 'dotenv/config'; // 👈 IMPORTANTE: Esto carga el archivo .env
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './database.js';

const app = express();

// Verificación de seguridad antes de arrancar
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ ERROR FATAL: Faltan las credenciales de Google en el archivo .env');
  process.exit(1);
}

// Configuración de la sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_por_defecto',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// CONFIGURACIÓN DE PASSPORT
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,     // Lee del archivo .env
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Lee del archivo .env
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      if (!profile.emails || profile.emails.length === 0) {
        return done(null, false, { message: 'No email found' });
      }

      const email = profile.emails![0]!.value!;

      const [usuarios]: any = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      
      if (usuarios && usuarios.length > 0) {
        return done(null, usuarios[0]);
      } else {
        console.log(`🚫 Usuario no autorizado: ${email}`);
        return done(null, false);
      }
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

// --- RUTAS ---

app.get('/', (req, res) => {
  res.send(`
    <div style="text-align:center; margin-top:50px; font-family: sans-serif;">
      <h1>Intranet IES</h1>
      <a href="/auth/google" style="padding: 10px 20px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px;">
        Entrar con Google
      </a>
    </div>
  `);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (_req, res) => {
    res.redirect('/panel');
  }
);

app.get('/panel', (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user as any;
    res.send(`
      <h1>Bienvenido al Panel</h1>
      <p>Usuario: <strong>${user.nombre} ${user.apellidos}</strong></p>
      <a href="/logout">Salir</a>
    `);
  } else {
    res.redirect('/');
  }
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en: http://localhost:3000`);
});