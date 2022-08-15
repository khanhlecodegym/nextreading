import { ENVIRONMENT } from '../configs/envVars';

// Implement logger, only show log for non-production env
// Consider: Lg into DB Collection

export const logger = (message: string) => {
  if (['prod', 'production'].indexOf(ENVIRONMENT) > -1) {
    return;
  }

  return console.log(message);
};
