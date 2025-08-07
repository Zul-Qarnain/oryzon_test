// facebookWebhook.js
// Usage: bun facebookWebhook.js "your message text here"

import fetch from 'node-fetch';

const messageText = process.argv[2];

if (!messageText) {
  console.error('Usage: bun facebookWebhook.js "your message text here"');
  process.exit(1);
}

const body = {
  object: "page",
  entry: [
    {
      id: "664738043390601",
      time: 1234567890,
      messaging: [
        {
          sender: { id: "b3d9e6d1-5fc8-4f37-9425-1a6b1e6e5bd7" },
          recipient: { id: "664738043390601" },
          timestamp: 1234567890123,
          message: {
            mid: "mid.$cAABa-abc123",
            text: messageText
          }
        }
      ]
    }
  ]
};

fetch("http://localhost:3000/api/webhooks/facebook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
})
  .then(res => res.text())
  .then(text => {
    console.log("Response:", text);
  })
  .catch(err => {
    console.error("Error:", err);
  });
