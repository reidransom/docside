import { expect, test as base } from '@playwright/test';
import { installLocalRequestPolicy } from '../local-policy.mjs';

export { expect };
export const test = base.extend({
  localRequests: [async ({}, use, testInfo) => {
    const requests = [];
    await use(requests);
    await testInfo.attach('local-requests', {
      body: JSON.stringify(requests, null, 2),
      contentType: 'application/json',
    });
    expect(requests.filter(({ action }) => action === 'blocked-external'),
      'Unexpected external HTTP(S) requests were blocked').toEqual([]);
  }, { auto: true }],

  context: async ({ context, baseURL, localRequests }, use) => {
    await installLocalRequestPolicy(context, { origins: [baseURL], requests: localRequests });
    await use(context);
  },

  createLocalContext: async ({ browser, baseURL, localRequests }, use) => {
    const contexts = [];
    await use(async (options = {}) => {
      const context = await browser.newContext({ baseURL, serviceWorkers: 'block', ...options });
      contexts.push(context);
      await installLocalRequestPolicy(context, { origins: [baseURL], requests: localRequests });
      return context;
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});
