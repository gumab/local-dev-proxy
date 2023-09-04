#!/usr/bin/env node
import path from 'path';
import { watchFile, unwatchFile } from 'fs';
import { LocalDevProxyOption } from '../types';
import { logger } from '../utils/logger';
import ProcessRunner from '../ProcessRunner';

function getConfig(configPath: string): LocalDevProxyOption {
  try {
    delete require.cache[configPath];
    // eslint-disable-next-line import/no-dynamic-require,global-require
    return require(configPath);
  } catch (e) {
    throw new Error('.ldprxrc.js 파일이 필요합니다');
  }
}

function parseArgv(): {
  configPath: string;
  command: string[];
} {
  const argv = process.argv.slice(2);

  if (/\.ldprxrc.*\.js$/.test(argv[0])) {
    return {
      configPath: path.join(process.cwd(), argv[0]),
      command: argv.slice(1),
    };
  }

  return {
    configPath: path.join(process.cwd(), '.ldprxrc.js'),
    command: argv,
  };
}

function main() {
  const runner = new ProcessRunner();
  const { command, configPath } = parseArgv();
  const config = getConfig(configPath);

  const configFileWatchListner = async () => {
    logger.log('config 파일에 변경이 감지되었습니다. 프로세스를 다시 시작합니다', 'blueBright');
    await runner.kill(2);
    void runner.run(command, getConfig(configPath)).catch((e) => {
      if (e instanceof Error) {
        logger.error(e);
      }
    });
  };

  watchFile(configPath, configFileWatchListner);
  // runner.onExit = () => {
  //   unwatchFile(configPath, configFileWatchListner);
  // };

  void runner.run(command, config).catch((e) => {
    if (e instanceof Error) {
      console.log('여기야?');
      logger.error(e);
    }
    // process.exit(1);
  });

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
      logger.log(`process stopped by ${signal}`);
      await runner.kill(signals[signal]);
      unwatchFile(configPath, configFileWatchListner);
      process.exit(128 + signals[signal]);
    });
  });
}

main();
