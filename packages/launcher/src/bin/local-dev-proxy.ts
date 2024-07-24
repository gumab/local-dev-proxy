#!/usr/bin/env node
import path from 'path';
import { watchFile, unwatchFile } from 'fs';
import { LocalDevProxyOption } from '../types';
import { logger } from '../utils/logger';
import ProcessRunner from '../ProcessRunner';
import { LdprxError } from '../libs/LdprxError';
import { wrapSpawn } from '../utils';
import i18n, { t } from '../i18n';

function getPackageType(): 'CommonJS' | 'ESModule' {
  try {
    const jsonPath = process.env.npm_package_json;
    if (jsonPath) {
      // eslint-disable-next-line import/no-dynamic-require,global-require,@typescript-eslint/no-var-requires
      const json = require(jsonPath);
      if (json.type === 'module') {
        return 'ESModule';
      }
    }
  } catch {
    // DO NOTHING
  }

  return 'CommonJS';
}

function getConfig(configPath: string): LocalDevProxyOption {
  try {
    delete require.cache[configPath];
    // eslint-disable-next-line import/no-dynamic-require,global-require
    return require(configPath);
  } catch (e) {
    throw new LdprxError(t('{{path}} file is required', { path: configPath.replace(/^.+\//g, '') }));
  }
}

function handleError(e: unknown) {
  if (e instanceof LdprxError) {
    logger.error(e);
  } else {
    throw e;
  }
}

function parseArgv(): {
  configPath: string;
  command: string[];
} {
  const argv = process.argv.slice(2);

  const type = getPackageType();

  if (/\.ldprxrc.*\.c?js$/.test(argv[0])) {
    if (!argv[0].endsWith(type === 'CommonJS' ? '.js' : '.cjs')) {
      throw new LdprxError(t('Check the file format. (CommonJS: .js, ESModule: .cjs)'));
    }

    return {
      configPath: path.join(process.cwd(), argv[0]),
      command: argv.slice(1),
    };
  }

  return {
    configPath: path.join(process.cwd(), `.ldprxrc.${type === 'CommonJS' ? 'js' : 'cjs'}`),
    command: argv,
  };
}

function main() {
  const runner = new ProcessRunner();
  const { command, configPath } = parseArgv();

  if (!['arm64', 'x64'].includes(process.arch) || process.platform !== 'darwin') {
    logger.error(t('is only available on Apple Silicon Mac.'));
    wrapSpawn(command[0], command.slice(1), { stdio: 'inherit' });
    return;
  }

  const config = getConfig(configPath);
  if (config.language) {
    i18n.changeLanguage(config.language);
  }

  const configFileWatchListner = async () => {
    logger.log(t('Changes detected in config file. Restarting process'), 'blueBright');
    try {
      await runner.kill(2);
      await runner.run(command, getConfig(configPath));
    } catch (e) {
      handleError(e);
    }
  };

  watchFile(configPath, configFileWatchListner);

  void runner.run(command, config).catch(handleError);

  const signals: { [key: string]: number } = {
    SIGINT: 2,
    SIGTERM: 15,
  };

  let isExited = false;

  Object.keys(signals).forEach((signal) => {
    process.on(signal, async () => {
      if (isExited) {
        return;
      }
      isExited = true;
      logger.log(t('process stopped by {{signal}}', { signal }));
      await runner.kill(signals[signal]);
      unwatchFile(configPath, configFileWatchListner);
      process.exit(128 + signals[signal]);
    });
  });
}

try {
  main();
} catch (e) {
  handleError(e);
}
