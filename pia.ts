import {
  BindPort,
  GetSignature,
  OpenVPN,
  Server,
  bindPort,
  exec,
  gateway,
  generateToken,
  getCredentials,
  getFastestServer,
  getSignature,
  localIp,
  logAddress,
  openvpn,
  publicIp,
  transmission,
  updateConfig,
} from './src/index.js';

import chalk from 'chalk';
import fs from 'fs';

const banner: string = fs.readFileSync('/vpn/banner.txt');

export async function pia() {

  console.log(chalk.bgGreenBright.whiteBright.bold(banner));

  const credentials = getCredentials();
  const [pub, server, token] = await Promise.all([
    publicIp(),
    getFastestServer(),
    generateToken(credentials),
  ]);

  const config = updateConfig({
    ...server,
    pub,
    token,
  });

  const [ready, process] = openvpn(config as OpenVPN);
  await ready;

  if (process?.cp?.pid != null) {
    updateConfig({ pid: process.cp.pid });
  }

  {
    const gw = await gateway('0\.0\.0\.0/1');
    const local = await localIp('pia');
    const pia = await publicIp();
    updateConfig({ gw, local, pia });
  }

  if (config.signature == null) {
    await getSignature(config as GetSignature)
      .then(signature => updateConfig({
        expires_at: signature.decoded.expires_at,
        payload: signature.payload,
        port: signature.decoded.port,
        signature: signature.signature,
      }))
      .catch(console.log);
  }

  if (config.signature != null) {
    const interval: any = {};
    const bindJob = () => bindPort(config as BindPort)
      .then(result => {
        if (/ok/i.test(result.status)) {
          console.log(`${chalk.grey(new Date().toLocaleTimeString())} ${chalk.greenBright(result.message)}`);
        } else {
          console.log(`${chalk.grey(new Date().toLocaleTimeString())} ${chalk.redBright(result.message)}`);
          clearInterval(interval.handle);
        }
      })
      .catch((error) => {
        console.log(error);
      });

    interval.handle = setInterval(bindJob, 300000);
    bindJob();
  }

  const trans = transmission(config);
  const transPid: string = trans?.cp?.pid?.toString(10) ?? 'N/A';

  console.log('');
  logAddress('PIA Gateway', config.gw);
  logAddress('PIA Local', config.local);
  logAddress('PIA Public', config.pia);
  logAddress('Public IP', config.pub);
  logAddress('Port Fwd', config.port);
  logAddress('OpenVPN PID', config.pid);
  logAddress('Trans PID', transPid);
  console.log('');

  await process;
  await trans;
}

if (/pia/i.test(process.argv[1])) {
  pia().catch(console.error);
}
