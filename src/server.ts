import 'source-map-support/register';

import app from './app';
import { initDb } from './auth/db/db';

const PORT = process.env.PORT || 2832;

(async () => {
  try {
    await initDb();
  } catch (e) {
    console.error(`Could not initialise database: ${e.message}`);
    throw e;
  }
  app.listen(PORT, async () => {
    console.log(`Rump listening on port ${PORT}`);
  });
})();
