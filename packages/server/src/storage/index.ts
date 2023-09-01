import { RouteRule } from '../types';
import fileStorage from './FileStorage';
import MemoryStorage from './MemoryStorage';

export interface Storage {
  setRules(rules: RouteRule[]): void;

  getRules(): RouteRule[];
}

export const storage: Storage = process.env.STORAGE === 'file' ? fileStorage : new MemoryStorage();
