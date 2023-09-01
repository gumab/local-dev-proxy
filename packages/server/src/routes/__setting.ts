import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { RouteRuleRequest } from 'shared/@types';
import { RouteRule } from '../types';
import { storage } from '../storage';

function getStringOrRegex(regexInput?: string | null): RegExp | undefined;
function getStringOrRegex(regexInput?: string | null, strInput?: string | null): RegExp | string | undefined;
function getStringOrRegex(regexInput?: string | null, strInput?: string | null) {
  if (regexInput) {
    try {
      // eslint-disable-next-line no-eval
      const rgx = eval(regexInput);
      if (rgx instanceof RegExp) {
        return rgx;
      }
    } catch (e) {
      // return nothing
    }
  } else if (strInput) {
    return strInput;
  }
}

const settingRouter = express.Router();
settingRouter.use(bodyParser.json());

const isLocalHost = (input: string) => /localhost|127\.0\.0\.1/.test(input);

function addRules(req: RouteRuleRequest[]) {
  // 이미 로컬을 보고 있는게 있으면 엎어쓰지 않는다
  // 새로 들어온것도 로컬이면 엎어쓴다
  const filtered = req
    .filter((x) => !storage.getRules().some((y) => y.key === x.key && isLocalHost(y.target) && !isLocalHost(x.target)))
    .map<RouteRule>(({ path, pathRegex, referrerRegex, ...rest }) => ({
      ...rest,
      path: getStringOrRegex(pathRegex, path),
      referrer: getStringOrRegex(referrerRegex),
    }));

  storage.setRules(
    storage
      .getRules()
      .filter((x) => !filtered.some((y) => y.key === x.key || y.target === x.target))
      .concat(filtered)
      .sort((a, b) => (a.priority || Number.MAX_VALUE) - (b.priority || Number.MAX_VALUE)),
  );

  return filtered;
}

function checkRequest(body: RouteRuleRequest[] | RouteRuleRequest): boolean {
  if (body instanceof Array) {
    return body.length > 0 && body.every(checkRequest);
  } else if (body) {
    return Boolean(body.key && body.host && body.target);
  }
  return false;
}

settingRouter.post('/register', (req: Request, res: Response) => {
  const data: RouteRuleRequest[] | RouteRuleRequest = req.body;
  if (!checkRequest(data)) {
    res.status(400).send('invalid input');
    return;
  }

  const added = addRules(data instanceof Array ? data : [data]);

  console.log(`[local-dev-proxy] registered \n${JSON.stringify(added, null, 2)}`);

  res.json({ success: true });
});

settingRouter.post('/deregister', (req: Request, res: Response) => {
  if (!req.body || !(req.body instanceof Array)) {
    res.status(400).send('invalid input');
    return;
  }
  const data: { key: string; target: string }[] = req.body;
  storage.setRules(storage.getRules().filter((x) => !data.some((y) => y.key === x.key && y.target === x.target)));
  console.log(`[local-dev-proxy] deregistered \n${JSON.stringify(data, null, 2)}`);

  res.json({ success: true });
});

settingRouter.get('/rules', (req: Request, res: Response) => {
  res.json(
    storage.getRules().map((x) => ({
      ...x,
      host: x.host?.toString(),
      path: x.path?.toString(),
      referrer: x.referrer?.toString(),
    })),
  );
});

export default settingRouter;
