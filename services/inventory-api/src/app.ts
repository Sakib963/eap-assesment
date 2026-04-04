import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { globalErrorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestContext } from './middleware/request-context.js';
import { apiRouter } from './routes/index.js';

export const app = express();

const allowedOrigins = env.corsOrigin
	.split(',')
	.map((origin) => origin.trim().replace(/\/+$/, ''))
	.filter(Boolean);

app.use(helmet());
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) {
				callback(null, true);
				return;
			}

			const normalizedOrigin = origin.replace(/\/+$/, '');
			callback(null, allowedOrigins.includes(normalizedOrigin));
		},
	})
);
app.use(express.json());
app.use(requestContext);
app.use(morgan('dev'));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
