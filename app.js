import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import hpp from 'hpp';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import { filterXSS } from 'xss';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { AppError } from './utils/appError.js';
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import { viewRouter } from './routes/viewRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import { webhookCheckout } from './controllers/bookingController.js';
import { globalErrorHandler } from './controllers/errorController.js';

const BASE_URL = '/api/v1/tours';
const USERS_URL = '/api/v1/users';
const REVIEWS_URL = '/api/v1/reviews';
const BOOKINGS_URL = '/api/v1/bookings';

export const app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('./public'));

app.set('query parser', 'extended');
app.disable('etag');

app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com', 'https://js.stripe.com'],
      styleSrc: ["'self'", 'https://unpkg.com', 'https://fonts.googleapis.com'],
      fontSrc: [
        "'self'",
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ],
      imgSrc: ["'self'", 'data:', 'https://*'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.enable('trust-proxy');

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests, please try again in an hour!',
});
app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.query) {
    const sanitizedQuery = JSON.parse(filterXSS(JSON.stringify(req.query)));
    Object.keys(sanitizedQuery).forEach((key) => {
      req.query[key] = sanitizedQuery[key];
    });
  }

  if (req.body) {
    const sanitizedBody = JSON.parse(filterXSS(JSON.stringify(req.body)));
    Object.keys(sanitizedBody).forEach((key) => {
      req.body[key] = sanitizedBody[key];
    });
  }

  next();
});

app.use(
  hpp({
    whitelist: [
      'price',
      'duration',
      'difficulty',
      'maxGroupSize',
      'rantingsAverage',
      'ratingsQuantity',
    ],
  })
);

app.use(compression());

app.use('/', viewRouter);
app.use(BASE_URL, tourRouter);
app.use(USERS_URL, userRouter);
app.use(REVIEWS_URL, reviewRouter);
app.use(BOOKINGS_URL, bookingRouter);

app.all('/{*any}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
