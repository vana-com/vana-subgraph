import { InitParams } from "../params/init-params";

export class ChainConfig {
  NAME: string;
  INIT_PARAMS: InitParams;

  constructor(name: string, initParams: InitParams) {
    this.NAME = name;
    this.INIT_PARAMS = initParams;
  }

  toString(): string {
    return `{
    NAME: ${this.NAME},
    INIT_PARAMS: ${this.INIT_PARAMS.toString()}
}`;
  }
}
