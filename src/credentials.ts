import { readFileSync } from 'fs';

export interface Credentials { 
  username: string;
  password: string;
}

export function getCredentials(filename: string = '/vpn/credentials.txt'): Credentials {
  const content = readFileSync(filename, 'utf-8') as string;
  
  const [
    username = '',
    password = '',
  ] = content.split('\n');

  return {
    username,
    password,
  };
}

