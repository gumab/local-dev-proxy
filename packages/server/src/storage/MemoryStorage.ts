import { RouteRule } from '../types';
import { Storage } from './index';

export default class MemoryStorage implements Storage {
  private rules: RouteRule[];

  constructor() {
    this.rules = [];
  }

  setRules(rules: RouteRule[]) {
    this.rules = rules;
  }

  getRules() {
    return this.rules;
  }
}
