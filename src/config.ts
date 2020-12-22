import { existsSync, readFileSync, writeFileSync } from "fs";

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

  if (!globalContext.loaded) {
    if (existsSync(configFilePath)) {
      const loadedConfig = JSON.parse(readFileSync(configFilePath, 'utf8'));
      Object.entries(loadedConfig).forEach(mergeInto);
    }
    globalContext.loaded = true;
  }


  Object.entries(newConfig).forEach(mergeInto);
  writeFileSync(configFilePath, JSON.stringify(globalContext.config, null, 2), 'utf8');

  return globalContext.config;
}
