import { Server, ServerInfo } from './types.js';
import {
  byPiaServer,
  byPing,
  intoServerList,
} from './filters.js';

import { Credentials } from './credentials.js';
import axios from 'axios';
import chalk from 'chalk';
import { exec } from './exec.js';
import fs from 'fs';
import https from 'https';
import pLimit from 'p-limit';
import { serverListUrl } from './constants.js';

export const getServerList = (): Promise<ServerInfo> =>
  axios.get<string>(serverListUrl)
    .then(res => res.data.split(/\n/g)[0])
    .then(text => JSON.parse(text) as ServerInfo);

const httPingLimit = pLimit(20);
export const httPing = (server: Server): Promise<Server> =>
  httPingLimit(() => {
    const startTime = Date.now();
    return axios
      .head(`http://${server.ip}/`, { timeout: 1000 })
      .catch(() => undefined)
      .then(() => ({ ...server, ping: Date.now() - startTime }));
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
    .then(res => res[0])
    .then(res => {
      console.log(`ping ${chalk.bold(res.cn.padStart(16))} ${chalk.greenBright(res.ping)}`);
      return res;
    });


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
  axios
    .get('https://api.ipify.org?format=json', { timeout: 5000 })
    .then(res => res.data.ip)

export const generateToken = (
  { username, password }: Credentials
): Promise<string> =>
  axios
    .get('https://privateinternetaccess.com/gtoken/generateToken', {
      auth: {
        username,
        password,
      }
    })
    .then((res) => res.data.token)


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

  const agent = new https.Agent({
    ca: fs.readFileSync('/vpn/ca.rsa.4096.crt'),
    timeout: 2000,
    servername: cn,
  });

  return axios.get(`https://${gw}:19999/getSignature`, {
    httpsAgent: agent,
    headers: { Host: gw },
    params: { token },
    timeout: 2000,
  }).then((res) => ({
    decoded: JSON.parse(Buffer.from(res.data.payload, 'base64').toString()),
    payload: res.data.payload,
    signature: res.data.signature,
  }));
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

  const agent = new https.Agent({
    ca: fs.readFileSync('/vpn/ca.rsa.4096.crt'),
    timeout: 2000,
    servername: cn,
  });

  return axios.get(`https://${gw}:19999/bindPort`, {
    httpsAgent: agent,
    headers: { Host: gw },
    params: { payload, signature },
    timeout: 2000,
  }).then((res) => ({
    status: res.data.status,
    message: res.data.message,
  }));
}
