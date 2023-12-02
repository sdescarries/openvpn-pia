import {
  gateway,
  localIp,
  logAddress,
  publicIp,
  route,
} from '../src/index.js';

publicIp().then(r => logAddress('WAN IP', r));
localIp(process.argv[2]).then(r => logAddress('LAN IP', r));
route().then(r => logAddress('LAN RT', r));
route('0.0.0.0.*').then(r => logAddress('LAN RT', r));
gateway().then(r => logAddress('LAN GW',  r));
