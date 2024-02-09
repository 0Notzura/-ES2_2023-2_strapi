/* global strapi */

const data = {
  name: "My new Product",
  price: 3.5,
};

it("Inserts a product with a transaction", async () => {
  const newTransaction = await strapi.db.connection.transaction();
  const insertedRows = await newTransaction("products").insert(data, "*");

  expect(insertedRows).toHaveLength(1);

  // Find it with Strapi - still not present in the database
  const productResult = await strapi.entityService.findMany(
    "api::product.product",
    {
      filters: data,
    }
  );

  expect(productResult).toHaveLength(0);

  await newTransaction.commit();

  const productResultAfterCommit = await strapi.entityService.findMany(
    "api::product.product",
    {
      filters: data,
    }
  );

  expect(productResultAfterCommit).toHaveLength(1);

  const newProduct = productResultAfterCommit[0];
  expect(newProduct).toMatchObject(data);

  await strapi.entityService.delete("api::product.product", newProduct.id);
});
