import { Request, Response } from 'express';
import { createProxyServer } from 'http-proxy';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { Socket } from 'net';
import { storage } from '../storage';
import { NotFoundError } from '../libs/errors/NotFoundError';
import { NoneSslError } from '../libs/errors/NoneSslError';
import { RouteRule } from '../types';

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

function findProxyRule(rules: RouteRule[], reqHost: string, reqPath?: string, reqReferer?: string) {
  return rules.find(({ host, path, referrer }) => {
    if (host !== reqHost) {
      return false;
    }
    if (path && reqPath) {
      if (typeof path === 'string') {
        if (path !== reqPath) {
          return false;
        }
      } else if (!path.test(reqPath)) {
        return false;
      }
    }
    if (referrer && reqReferer) {
      if (!referrer.test(reqReferer)) {
        return false;
      }
    }
    return true;
  });
}

function makeProxyOption(req: Request): { target: string; ignorePath?: boolean; cookieDomainRewrite?: string } {
  const rule = findProxyRule(storage.getRules(), req.hostname, req.path, req.headers['referer']);
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

export function proxyMiddleware(req: Request, res: Response) {
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

const wsProxy = createProxyServer<IncomingMessage, Socket>({ ws: true });

wsProxy.on('error', (err, req, res) => {
  console.error(err);
  res.destroy();
});

export function proxyWebSocket<Request extends typeof IncomingMessage = typeof IncomingMessage>(
  request: InstanceType<Request>,
  socket: Duplex,
  head: Buffer,
) {
  if (request.headers.host) {
    const rule = findProxyRule(
      storage.getRules().filter((x) => /localhost/.test(x.target)),
      request.headers.host,
    );
    if (rule) {
      const host = rule.target.replace(/https?:\/\/([^/]+).*/, '$1');
      wsProxy.ws(request, socket, head, { target: `ws://${host}` });
      return;
    }
  }
  socket.destroy();
}
