import { exec } from '../src/index.js';

exec(process.argv.slice(2))
  .then(console.log);
