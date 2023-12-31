import type { Context, Next } from 'koa';

import { getService } from '../utils';

export default () => async (ctx: Context, next: Next) => {
  const transferUtils = getService('transfer').utils;

  const { hasValidTokenSalt, isDataTransferEnabled, isDisabledFromEnv } = transferUtils;

  if (isDataTransferEnabled()) {
    return next();
  }

  if (!hasValidTokenSalt()) {
    return ctx.notImplemented(
      'The server configuration for data transfer is invalid. Please contact your server administrator.',
      // @ts-expect-error have to pass multiple arguments to surface the error details
      {
        code: 'INVALID_TOKEN_SALT',
      }
    );
  }

  if (isDisabledFromEnv()) {
    return ctx.notFound();
  }

  // This should never happen as long as we're handling individual scenarios above
  throw new Error('Unexpected error while trying to access a data transfer route');
};
