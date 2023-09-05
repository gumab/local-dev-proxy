import { Request, Response } from 'express';
import { createProxyServer } from 'http-proxy';
import { storage } from '../storage';
import { NotFoundError } from '../libs/errors/NotFoundError';
import { NoneSslError } from '../libs/errors/NoneSslError';

const proxyServer = createProxyServer({
  secure: false,
  changeOrigin: true,
});

proxyServer.on('error', (err, req, res) => {
  (res as Response).status(500).send(err);
});

function fixLocalHost<T extends { target: string }>(input: T) {
  const localhostIp = process.env.LOCALHOST || '127.0.0.1';

  return {
    ...input,
    target: input.target.replace(/(https?:\/\/)(?:localhost|127\.0\.0\.1)/, `$1${localhostIp}`),
  };
}

function makeProxyOption(req: Request): { target: string; ignorePath?: boolean; cookieDomainRewrite?: string } {
  const rule = storage.getRules().find(({ host, path, referrer }) => {
    if (host !== req.hostname) {
      return false;
    }
    if (path) {
      if (typeof path === 'string') {
        if (path !== req.path) {
          return false;
        }
      } else if (!path.test(req.path)) {
        return false;
      }
    }
    if (referrer) {
      if (!referrer.test(req.headers['referer']?.toString() || '')) {
        return false;
      }
    }
    return true;
  });

  if (!rule) {
    throw new NotFoundError(`매칭되는 서버가 없습니다. (${req.protocol}://${req.hostname}${req.path})`);
  } else if (!rule.https && req.protocol === 'https') {
    throw new NoneSslError(
      `HTTPS 가 설정되지 않았습니다. .ldprxrc.js 파일을 확인해주세요 (${req.protocol}://${req.hostname}${req.path})`,
    );
  }

  if (rule.pathRewrite) {
    const rewrittenPath = Object.entries(rule.pathRewrite).reduce(
      (path, [pattern, value]) => path.replace(new RegExp(pattern), value),
      req.path,
    );

    return {
      target: rule.target + rewrittenPath,
      ignorePath: true,
    };
  }
  return {
    target: rule.target,
  };
}

export default function (req: Request, res: Response) {
  try {
    const option = fixLocalHost(makeProxyOption(req));
    proxyServer.web(req, res, option);
  } catch (e) {
    if (e instanceof NotFoundError) {
      res.status(404).send(`[local-dev-proxy] ${e.message}`);
    } else if (e instanceof NoneSslError) {
      res.redirect(`http://${req.hostname}${req.url}`);
    } else if (e instanceof Error) {
      res.status(500).send(`[local-dev-proxy] ${e.message}`);
    } else {
      throw e;
    }
  }
}
