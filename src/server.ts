import 'source-map-support/register';

import app from './app';
import { initDb } from './auth/db/db';

(async () => {
  app.listen(2832, async () => {
    console.log('Listening on 2832');
    try {
      await initDb();
    } catch (e) {
      console.error(`Could not initialise database: ${e.message}`);
    }
  });
})();
