import { mkdirSync, writeFileSync } from 'fs';
import { exec, ExecPromise } from './exec';

const transConfig = (config: any) => ({
    'alt-speed-down': 50,
    'alt-speed-enabled': false,
    'alt-speed-time-begin': 540,
    'alt-speed-time-day': 127,
    'alt-speed-time-enabled': false,
    'alt-speed-time-end': 1020,
    'alt-speed-up': 50,
    'bind-address-ipv4': config.local,
    'bind-address-ipv6': '::',
    'blocklist-enabled': true,
    'blocklist-url': 'http://john.bitsurge.net/public/biglist.p2p.gz',
    'cache-size-mb': 64,
    'dht-enabled': true,
    'download-dir': '/data/completed',
    'download-queue-enabled': true,
    'download-queue-size': 5,
    'encryption': 1,
    'idle-seeding-limit': 30,
    'idle-seeding-limit-enabled': false,
    'incomplete-dir': '/data/incomplete',
    'incomplete-dir-enabled': true,
    'lpd-enabled': false,
    'message-level': 2,
    'peer-congestion-algorithm': '',
    'peer-id-ttl-hours': 6,
    'peer-limit-global': 240,
    'peer-limit-per-torrent': 60,
    'peer-port': config.port,
    'peer-port-random-high': 65535,
    'peer-port-random-low': 49152,
    'peer-port-random-on-start': false,
    'peer-socket-tos': 'default',
    'pex-enabled': true,
    'port-forwarding-enabled': false,
    'preallocation': 1,
    'prefetch-enabled': true,
    'queue-stalled-enabled': true,
    'queue-stalled-minutes': 30,
    'ratio-limit': 4,
    'ratio-limit-enabled': true,
    'rename-partial-files': true,
    'rpc-authentication-required': false,
    'rpc-bind-address': '0.0.0.0',
    'rpc-enabled': true,
    'rpc-host-whitelist': '',
    'rpc-host-whitelist-enabled': false,
    'rpc-password': '{116e9c74031a3f24159ec800cab71eaa11ebc6bbmjU.jkgT',
    'rpc-port': 9091,
    'rpc-url': '/transmission/',
    'rpc-username': 'username',
    'rpc-whitelist': '127.0.0.1,::1',
    'rpc-whitelist-enabled': false,
    'scrape-paused-torrents-enabled': true,
    'script-torrent-done-enabled': false,
    'script-torrent-done-filename': '',
    'seed-queue-enabled': false,
    'seed-queue-size': 10,
    'speed-limit-down': 100,
    'speed-limit-down-enabled': false,
    'speed-limit-up': 100,
    'speed-limit-up-enabled': false,
    'start-added-torrents': true,
    'trash-original-torrent-files': false,
    'umask': 2,
    'upload-slots-per-torrent': 14,
    'utp-enabled': true,
    'watch-dir': '/data/watch',
    'watch-dir-enabled': true,
    'watch-dir-force-generic': false
});

export function transmission(config: any): ExecPromise {
  config = JSON.stringify(transConfig(config), null, 2);
  writeFileSync('/trans/settings.json', config, 'utf8');
  return exec('/usr/bin/transmission-daemon --foreground --config-dir /trans');
}