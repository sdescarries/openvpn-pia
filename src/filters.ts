import { Server, ServerRegion } from './types.js';

const piaServer = process.env['PIA_SERVER'];
export const byPiaServer =
  piaServer ?
    ({ country, port_forward }: ServerRegion) => (port_forward && new RegExp(piaServer, 'i').test(country)) :
    ({ port_forward }: ServerRegion) => port_forward;

export const byPing =
  (
    { ping: a = 9.999 }: { ping: number },
    { ping: b = 9.999 }: { ping: number }
  ): number => (a - b);

export function intoServerList(result: Server[], {servers}: ServerRegion): Server[] {
  for (let idx = 0; idx < servers.ovpnudp.length; idx++) {
    const server = servers.ovpnudp[idx];
    const { ip: meta } = servers.meta[idx];
    result.push({ ...server, meta });
  }
  return result;
}
