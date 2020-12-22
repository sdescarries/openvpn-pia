export interface Server {
  cn: string;
  ip: string;
  meta: string;
  ping: number;
}

export interface ServerRegion {
  id: string,
  name: string, 
  country: string, 
  dns: string;
  port_forward: boolean;
  geo: boolean;
  servers: {
    [key: string]: Server[],
  }
}

export interface ServerGroup {
  name: string,
  ports: number[],
}

export interface ServerInfo {
  groups: {
    [key: string]: ServerGroup[];
  }
  regions: ServerRegion[];
}

