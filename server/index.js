const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');
const { config } = require('./config/env');
const { createApp } = require('./app');

const app = createApp();

app.listen(config.port, () => {
  console.log(`API at http://localhost:${config.port}/api/board`);
  if (fs.existsSync(config.indexHtml)) {
    console.log(`App UI served from http://localhost:${config.port}`);
  } else {
    console.log('No client build yet — run npm run build, or npm run dev for Vite.');
  }
});
