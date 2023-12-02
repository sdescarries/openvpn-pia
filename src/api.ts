import { Server, ServerInfo } from './types.js';
import {
  byPiaServer,
  byPing,
  intoServerList,
} from './filters.js';

import { Credentials } from './credentials.js';
import chalk from 'chalk';
import { exec } from './exec.js';
import pLimit from 'p-limit';
import { serverListUrl } from './constants.js';

export const getServerList = (): Promise<ServerInfo> => {
  const cmd = [
    'curl', '-s',
    serverListUrl,
  ];
  return exec(cmd)
    .then(text => text.split(/\n/g)[0])
    .then(text => JSON.parse(text) as ServerInfo)
    .catch(error => {
      console.error(`exec command failed: ${cmd.join(' ')}`);
      throw error;
    });
}

const httPingLimit = pLimit(10);
export const httPing = (server: Server): Promise<Server> =>
  httPingLimit(() =>
    exec([
      'curl', '-s',
      '--connect-timeout', '1',
      '--write-out', '%{time_connect}',
      `http://${server.ip}/`,
    ], {
      expectedStatusCode: 52,
    }
  )).then(parseFloat)
    .catch(() => 9.999)
    .then((ping: number) => {
      if (ping !== ping) {
        ping = 9.999;
      }
      console.log(`ping ${chalk.bold(server.cn.padStart(16))} ${chalk.greenBright(ping)}`);
      return ({ ...server, ping })
    });

export const getFastestServer = (): Promise<Server> =>
  getServerList()
    .then(({ regions }: ServerInfo) =>
      Promise.all(
        regions
          .filter(byPiaServer)
          .reduce(intoServerList, [])
          .map(httPing)
      ))
    .then(res => res.sort(byPing))
    .then(res => res[0]);


export const route = (match: string = 'default'): Promise<string> =>
  exec('ip route')
    .then((res: string) => res?.match(new RegExp(`^${match} (via .*)$`, 'm'))?.[1] ?? '');

export const gateway = (match?: string): Promise<string> =>
  route(match)
    .then((res: string) => res.split(' ')[1]);

export const localIp = (dev: string = 'pia'): Promise<string> =>
  exec('ip a')
    .then((res: string) => res?.match(new RegExp(` *inet ([0-9.]+).*${dev}`, 'i'))?.[1] ?? '');

export const publicIp = (): Promise<string> => {
  const cmd = [
    'curl', '-s',
    '--connect-timeout', '1',
    'https://api.ipify.org?format=json',
  ];
  return exec(cmd).then(res => JSON.parse(res))
    .then(({ ip }) => ip)
    .catch(error => {
      console.error(`exec command failed: ${cmd.join(' ')}`);
      throw error;
    });
}

export const generateToken = (
  { username, password }: Credentials
): Promise<string> => {
  const cmd = [
    'curl', '-s',
    '-u', `${username}:${password}`,
    `https://privateinternetaccess.com/gtoken/generateToken`,
  ];

  return exec(cmd).then(res => JSON.parse(res))
    .then(({ token }) => token)
    .catch(error => {
      console.error(`exec command failed: ${cmd.join(' ')}`);
      throw error;
    });
}

export interface GetSignature {
  cn: string;
  gw: string;
  token: string;
}

export interface Signature {
  decoded: {
    expires_at: Date,
    port: number,
    token: string,
  },
  payload: string,
  signature: string,
}

export const getSignature = ({
  cn,
  gw,
  token,
}: GetSignature): Promise<Signature> => {
  const cmd = [
    'curl',
    '-s',
    '--cacert', "/vpn/ca.rsa.4096.crt",
    '--connect-timeout', '2',
    '--connect-to', `${cn}::${gw}:`,
    '-G', '--data-urlencode', `token=${token}`,
    `https://${cn}:19999/getSignature`,
  ];

  return exec(cmd).then(res => JSON.parse(res))
    .then(({ payload, signature }) => ({
      decoded: JSON.parse(Buffer.from(payload, 'base64').toString()),
      payload,
      signature,
      }))
    .catch(error => {
      console.error(`exec command failed: ${cmd.join(' ')}`);
      throw error;
    });
  }
export interface BindPort {
  cn: string;
  gw: string;
  payload: string;
  signature: string;
}

export interface BindPortResult {
  status: any;
  message: string;
}

export const bindPort = ({
  cn,
  gw,
  payload,
  signature,
}: BindPort): Promise<BindPortResult> => {
  const cmd = [
    'curl', '-s',
    '--cacert', "/vpn/ca.rsa.4096.crt",
    '--connect-timeout', '2',
    '--connect-to', `${cn}::${gw}:`,
    '-G',
    '--data-urlencode', `payload=${payload}`,
    '--data-urlencode', `signature=${signature}`,
    `https://${cn}:19999/bindPort`,
  ];
  return exec(cmd).then(res => JSON.parse(res))
    .then(({ status, message }) => ({ status, message }))
    .catch(error => {
      console.error(`exec command failed: ${cmd.join(' ')}`);
      throw error;
    });
}
