export interface RouteRule {
  key: string;
  priority?: number;
  path?: string | RegExp;
  host: string;
  referrer?: RegExp;
  pathRewrite?: { [key: string]: string };
  target: string;
}
