import chalk from 'chalk';
import { exec, ExecPromise } from './exec';
import { Server } from './types';

export interface OpenVPN extends Server {
  pid: string;
}

export const openvpnLogger = (context: any, color: Function) => {
  const buffer: string[] = [];
  return (line: string) => {
    const split: string[] = line?.split('\n') ?? [];

    const doPop = () => {
      const pop = split.pop()?.trim() ?? '';
      if (pop) {
        buffer.push(pop);
      }
    }

    while (split.length > 1) {
      doPop();
      const output = buffer.join('');
      console.log(color(`\t${output}`));
      if (/ip addr add dev pia/i.test(output)) {
        context.resolve();
      }
      buffer.splice(0, buffer.length);
    }
    doPop();
  }
}

function launch({ cn, ip }: OpenVPN): [Promise<void>, ExecPromise] {

  console.log(`\nInitiate OpenVPN on ${chalk.blueBright.bold(cn)} [${chalk.gray(ip)}]\n`);
  const cmd = [
    '/usr/sbin/openvpn',
    '--auth', 'sha1',
    '--auth-nocache',
    '--auth-user-pass', "/vpn/credentials.txt",
    '--ca', "/vpn/ca.rsa.2048.crt",
    '--cipher', 'aes-128-cbc',
    '--client',
    '--comp-lzo', 'no',
    '--crl-verify', '/vpn/crl.rsa.2048.pem',
    '--dev', 'pia',
    '--dev-type', 'tun',
    '--disable-occ',
    '--mute-replay-warnings',
    '--persist-key',
    '--persist-tun',
    '--ping', '10',
    '--ping-restart', '3600',
    '--ping-timer-rem',
    '--proto', 'udp',
    '--pull-filter', 'ignore', 'ifconfig-ipv6',
    '--pull-filter', 'ignore', 'route-ipv6',
    '--remote', ip, '1198',
    '--remote-cert-tls', 'server',
    '--reneg-sec', '36000',
    '--replay-persist', '/vpn/info/ovpn-replay.dat',
    '--script-security', '2',
    '--tls-client',
    '--verb', '2',
  ];

  const context: any = {};

  context.ready = new Promise(resolve => context.resolve = resolve);
  context.process = exec(cmd, {
    onStdout: openvpnLogger(context, chalk.blue),
    onStderr: openvpnLogger(context, chalk.yellow),
  });

  setTimeout(context.resolve, 60000);

  return [
    context.ready,
    context.process,
  ];
}

function skip({ pid }: OpenVPN): [Promise<void>, ExecPromise] {
  console.log(`\nOpenVPN already running with PID ${chalk.blueBright.bold(pid)}\n`);
  return [
    Promise.resolve(),
    new ExecPromise((resolve: Function) => resolve('')),
  ];
}

export const openvpn = (server: OpenVPN): [Promise<void>, ExecPromise] =>
  (server.pid ? skip(server) : launch(server));
