async function run() {
  console.log("=== Concurrency Test ===");

  // 1. Check initial inventory
  console.log("Fetching initial products...");
  const resProducts = await fetch('http://localhost:3001/operations/get-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: {} })
  });
  const productsText = await resProducts.text();
  console.log("Products response:", productsText);

  // 2. Fire 2 concurrent checkout requests
  console.log("Firing 2 concurrent checkout requests for Ergonomic Mechanical Keyboard (ID: 2)...");
  const checkoutPayload = {
    json: {
      cartItems: [
        { productId: 2, quantity: 1 }
      ]
    }
  };

  const p1 = fetch('http://localhost:3001/operations/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkoutPayload)
  });

  const p2 = fetch('http://localhost:3001/operations/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkoutPayload)
  });

  const [r1, r2] = await Promise.all([p1, p2]);

  const text1 = await r1.text();
  const text2 = await r2.text();

  console.log("\nResponse 1 Status:", r1.status);
  console.log("Response 1 Body:", text1);

  console.log("\nResponse 2 Status:", r2.status);
  console.log("Response 2 Body:", text2);
}

run().catch(console.error);
