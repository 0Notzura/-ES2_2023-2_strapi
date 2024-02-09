//path: ./tests/app.test.js

const fs = require('fs');
const { setupStrapi, teardownStrapi } = require("./helpers/strapi");

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await teardownStrapi();
});

it("strapi is defined", () => {
  expect(strapi).toBeDefined(); //confirms that the strapi instance is defined
});
 