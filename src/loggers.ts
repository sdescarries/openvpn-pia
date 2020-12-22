import chalk from 'chalk';

export function logAddress(label: string, address: string) {
  label = label.padEnd(12, ' ');
  console.log(`✧ ${chalk.gray.bold(label)} ${chalk.greenBright.bold(address)}`);
}
