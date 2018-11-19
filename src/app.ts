import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import * as session from './session';
import routes from './routes';

const app = express();

// app.use(morgan('tiny'));
// Allow for cross origin requests, as this is
// an API
app.use(cors());

// Parse any body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Decode token from session
app.use(session.decoder);

app.use(routes);

export default app;
