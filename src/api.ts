import chalk from 'chalk';
import pLimit from 'p-limit';
import { Credentials } from './credentials';
import { Server, ServerInfo } from './types';
import { exec } from './exec';
import { serverListUrl } from './constants';
import {
  byPiaServer,
  byPing,
  intoServerList,
} from './filters';

export const getServerList = (): Promise<ServerInfo> => 
  exec(`curl -s ${serverListUrl}`)
    .then(text => text.split(/\n/g)[0])
    .then(text => JSON.parse(text) as ServerInfo);

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
  )).then(res => parseFloat(res))
    .catch(() => 9.999)
    .then(ping => {
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

export const publicIp = (): Promise<string> =>
  exec([
    'curl', '-s',
    '--connect-timeout', '1',
    'https://api.ipify.org?format=json',
  ]).then(res => JSON.parse(res))
    .then(({ ip }) => ip);

export const generateToken = (
  { cn, meta }: Server,
  { username, password }: Credentials
): Promise<string> =>
  exec([
    'curl', '-s',
    '-u', `${username}:${password}`,
    '--cacert', "/vpn/ca.rsa.4096.crt",
    '--connect-timeout', '2',
    '--connect-to', `${cn}::${meta}:`,
    `https://${cn}/authv3/generateToken`,
  ]).then(res => JSON.parse(res))
    .then(({ token }) => token);

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
}: GetSignature):
  Promise<Signature> => exec([
    'curl',
    '-s',
    '--cacert', "/vpn/ca.rsa.4096.crt",
    '--connect-timeout', '2',
    '--connect-to', `${cn}::${gw}:`,
    '-G', '--data-urlencode', `token=${token}`, 
    `https://${cn}:19999/getSignature`,
  ]).then(res => JSON.parse(res))
    .then(({ payload, signature }) => ({
      decoded: JSON.parse(Buffer.from(payload, 'base64').toString()),
      payload,
      signature,
    }));

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
}: BindPort):
  Promise<BindPortResult> =>
  exec([
    'curl', '-s',
    '--cacert', "/vpn/ca.rsa.4096.crt",
    '--connect-timeout', '2',
    '--connect-to', `${cn}::${gw}:`,
    '-G',
    '--data-urlencode', `payload=${payload}`, 
    '--data-urlencode', `signature=${signature}`, 
    `https://${cn}:19999/bindPort`,
  ]).then(res => JSON.parse(res))
    .then(({ status, message }) => ({ status, message }));

