// backend/index.test.js
const sumar = (a, b) => a + b;

test("La suma de 2 + 2 es 4", () => {
  expect(sumar(2, 2)).toBe(4);
});
