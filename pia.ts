import chalk from 'chalk';
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
  updateConfig,
  transmission,
} from './src';

const banner: string = `
                                                                    
                                                                    
       ____                 _    ______  _   __   ____  _______     
      / __ \\____  ___  ____| |  / / __ \\/ | / /  / __ \\/  _/   |    
     / / / / __ \\/ _ \\/ __ \\ | / / /_/ /  |/ /  / /_/ // // /| |    
    / /_/ / /_/ /  __/ / / / |/ / ____/ /|  /  / ____// // ___ |    
    \\____/ .___/\\___/_/ /_/|___/_/   /_/ |_/  /_/   /___/_/  |_|    
        /_/                                                         
                                                                    
                                                                    
`;

export async function pia() {

  console.log(chalk.bgGreenBright.whiteBright.bold(banner));

  const pid = await exec('pgrep openvpn').catch(() => '');
  const config = updateConfig({ pid });

  if (!pid) {

    const pub = await publicIp();

    if (config.pub == null || config.pub !== pub) {
      updateConfig({
        pub,
  
        // Reset everything else
        cn: null,
        payload: null,
        port: null,
        signature: null,
        token: null,
      });
    }
  }

  if (config.cn == null) {
    const server = await getFastestServer();
    updateConfig(server);
  }

  if (config.token == null) {
    const credentials = getCredentials();
    const token = await generateToken(config as Server, credentials);
    updateConfig({ token });
  }

  const [ready, process] = openvpn(config as OpenVPN);
  await ready;

  if (process?.cp?.pid) {
    updateConfig({ pid: process?.cp?.pid });
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
      .catch(console.log)
    
    interval.handle = setInterval(bindJob, 300000);
    bindJob();
  }

  const trans = transmission(config);
  const transPid: string = trans?.cp?.pid.toString(10) ?? 'N/A';

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
