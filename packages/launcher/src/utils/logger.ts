/* eslint-disable no-console */
import chalk, { Color } from 'chalk';

export const logger = {
  log: (message: string, color?: typeof Color) => {
    if (color) {
      console.log(chalk[color](`[local-dev-proxy] ${message}`));
    } else {
      console.log(chalk.greenBright(`[local-dev-proxy] ${message}`));
    }
  },
  warn: (message: string) => {
    console.warn(chalk.yellow(`[local-dev-proxy] ${message}`));
  },
  error: (messageOrError: string | Error) => {
    if (messageOrError instanceof Error) {
      console.error(chalk.red(`[local-dev-proxy] ${messageOrError.message}`));
    } else {
      console.error(chalk.red(`[local-dev-proxy] ${messageOrError}`));
    }
  },
};
