import { writeFileSync } from "fs";

interface Variant {
  [key: string]: any;
}

interface Context {
  loaded: boolean;
  config: Variant;
}

const globalContext: Context = {
  loaded: false,
  config: {},
};

const mergeInto =
  ([key, value]: [string, any]) =>
    (globalContext.config[key] = value);

const configFilePath = '/vpn/info/pia.json';

export function updateConfig(newConfig: Variant = {}): Variant {

  Object.entries(newConfig).forEach(mergeInto);
  //writeFileSync(configFilePath, JSON.stringify(globalContext.config, null, 2), 'utf8');

  return globalContext.config;
}
