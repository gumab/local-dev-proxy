import fs from 'fs';
import { RouteRule } from '../types';
import { Storage } from './index';

interface FileSavedRule extends Omit<RouteRule, 'path' | 'host' | 'referrer'> {
  path?: string;
  host?: string;
  referrer?: string;
}

const fileStorage: Storage = {
  setRules(rules: RouteRule[]) {
    fs.writeFileSync(
      'storage.json',
      JSON.stringify(
        rules.map<FileSavedRule>((x) => ({
          ...x,
          path: x.path?.toString(),
          host: x.host?.toString(),
          referrer: x.referrer?.toString(),
        })),
        null,
        2,
      ),
    );
  },

  getRules(): RouteRule[] {
    try {
      return (JSON.parse(fs.readFileSync('storage.json').toString()) as FileSavedRule[]).map<RouteRule>((x) => ({
        ...x,
        /* eslint-disable no-eval */
        path: x.path && /^\/.+\/$/.test(x.path) ? eval(x.path) : x.path,
        host: x.host && /^\/.+\/$/.test(x.host) ? eval(x.host) : x.host,
        referrer: x.referrer && /^\/.+\/$/.test(x.referrer) ? eval(x.referrer) : x.referrer,
        /* eslint-enable no-eval */
      }));
    } catch (e) {
      return [];
    }
  },
};

export default fileStorage;
