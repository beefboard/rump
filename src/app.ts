import 'source-map-support/register';

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as session from './session';
import { initDb } from './data/db/db';
import v1 from './routes/v1';

const app = express();

// Allow for cross origin requests, as this is
// an API
app.use(cors());

// Parse any body
app.use(bodyParser.json());

// Decode token from session
app.use(session.decoder);

app.use('/v1', v1);

app.get('/', (_, res) => {
  res.send({
    v1: '/v1'
  });
});

app.use((_, res) => {
  res.status(404).send({
    error: 'Not found'
  });
});

app.listen(2832, async () => {
  console.log('Listening on 2832');
  try {
    await initDb();
  } catch (e) {
    console.error(`Could not initialise database: ${e.message}`);
  }
});
