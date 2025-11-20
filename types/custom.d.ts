// Fallback module declarations for environments where type packages are missing.
declare module 'express' {
  export interface Request<Params = any, ResBody = any, ReqBody = any> {
    body?: ReqBody;
    params?: Params;
    res?: ResBody;
  }

  export interface Response {
    status(code: number): Response;
    json(body?: any): Response;
  }

  export type RequestHandler = (req: Request, res: Response, next?: () => void) => any;

  export interface ExpressApp {
    use: (...args: any[]) => ExpressApp;
    get: (path: string, handler: RequestHandler) => ExpressApp;
    post: (path: string, handler: RequestHandler) => ExpressApp;
    listen: (port: number, cb?: () => void) => any;
  }

  type JsonMiddleware = () => any;

  type ExpressFactory = (() => ExpressApp) & {
    json: JsonMiddleware;
  };

  const createExpress: ExpressFactory;
  export default createExpress;
}

declare module 'cors' {
  const cors: () => (req: any, res: any, next: () => void) => void;
  export default cors;
}

declare module 'openai';

declare const process: {
  env: Record<string, string | undefined>;
};
