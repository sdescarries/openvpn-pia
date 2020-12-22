import { exec } from '../src';

exec(process.argv.slice(2))
  .then(console.log);
