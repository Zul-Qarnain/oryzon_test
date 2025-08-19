// facebookWebhook.js
// Usage: bun facebookWebhook.js "your message text here"

async function main() {
  const messageText = process.argv.slice(2).join(" ");
  console.log("Message text:", messageText);

  if (!messageText) {
    console.error('Usage: bun facebookWebhook.js "your message text here"');
    process.exit(1);
  }

  const body = {
    object: "page",
    entry: [
      {
        id: "664738043390601", // Your Facebook Page ID
        time: Date.now(),
        messaging: [
          {
            sender: { id: "b3d9e6d1-5fc8-4f37-9425-1a6b1e6e5bd7" }, // A test user PSID
            recipient: { id: "664738043390601" }, // Your Facebook Page ID
            timestamp: Date.now(),
            message: {
              mid: `mid.$${Math.random().toString(36).substring(7)}`,
              text: messageText
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch("http://localhost:3000/api/webhooks/facebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
