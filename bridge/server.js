const http = require("http");
const crypto = require("crypto");
const mqtt = require("mqtt");

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MQTT_BROKER_URL = "mqtt://captain.dev0.pandor.cloud:1884";

// Set to maintain the list of active WebSocket clients
const connectedClients = new Set();

/**
 * Removes a client from the Set of connected clients
 * @param {net.Socket} socket - The WebSocket socket to remove
 */
function removeClient(socket) {
  if (connectedClients.has(socket)) {
    connectedClients.delete(socket);
    console.log(
      `Client disconnected. Active clients: ${connectedClients.size}`
    );
  }
}

/**
 * Sends a text message via WebSocket
 * @param {net.Socket} socket - The WebSocket socket
 * @param {string} text - The text to send
 */
function sendText(socket, text) {
  const payload = Buffer.from(text, "utf8");
  const payloadLength = payload.length;

  let frame = Buffer.alloc(2);

  // Byte 0: FIN=1, opcode=0x1 (text frame)
  frame[0] = 0x81;

  // Byte 1: MASK=0 (no mask on server side), length
  if (payloadLength < 126) {
    frame[1] = payloadLength;
  } else if (payloadLength < 65536) {
    // Length on 2 bytes (big-endian)
    frame[1] = 126;
    const lengthBuffer = Buffer.alloc(2);
    lengthBuffer.writeUInt16BE(payloadLength, 0);
    frame = Buffer.concat([frame, lengthBuffer]);
  } else {
    // Length on 8 bytes (big-endian)
    frame[1] = 127;
    const lengthBuffer = Buffer.alloc(8);
    // Write on the last 4 bytes (first 4 are always 0 for sizes < 2^32)
    lengthBuffer.writeUInt32BE(0, 0);
    lengthBuffer.writeUInt32BE(payloadLength, 4);
    frame = Buffer.concat([frame, lengthBuffer]);
  }

  frame = Buffer.concat([frame, payload]);

  socket.write(frame);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("HTTP Server running");
});

server.on("upgrade", (request, socket, head) => {
  const headers = request.headers;

  if (headers.upgrade?.toLowerCase() !== "websocket") {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  if (!headers["sec-websocket-key"]) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  if (headers["sec-websocket-version"] !== "13") {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  const key = headers["sec-websocket-key"];
  const acceptKey = crypto
    .createHash("sha1")
    .update(key + WS_GUID)
    .digest("base64");

  const responseHeaders =
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
    ].join("\r\n") + "\r\n\r\n";

  socket.write(responseHeaders);

  connectedClients.add(socket);
  console.log(`New client connected. Active clients: ${connectedClients.size}`);

  // Send welcome message
  sendText(
    socket,
    JSON.stringify({ type: "connected", message: "WebSocket connected" })
  );

  socket.on("end", () => {
    removeClient(socket);
  });

  socket.on("close", () => {
    removeClient(socket);
  });

  socket.on("error", (err) => {
    console.error("WebSocket error:", err);
    removeClient(socket);
  });

  // TODO: Handle WebSocket frames
  socket.on("data", (data) => {
    console.log("Received WebSocket frame:", data);
  });
});

const mqttClient = mqtt.connect(MQTT_BROKER_URL);

const WEATHER_TOPIC = "classroom/+/telemetry";

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  // Subscribe to weather topic with wildcard
  mqttClient.subscribe(WEATHER_TOPIC, (err) => {
    if (err) {
      console.error("Subscription error:", err);
    } else {
      console.log(`Subscribed to topic: ${WEATHER_TOPIC}`);
    }
  });
});

mqttClient.on("message", (topic, message) => {
  const payloadString = message.toString("utf8");

  let payload;
  try {
    payload = JSON.parse(payloadString);
  } catch (e) {
    // If not valid JSON, use raw string
    payload = payloadString;
  }

  const messageToSend = {
    topic: topic,
    payload: payload,
    receivedAt: Date.now(),
  };

  const jsonMessage = JSON.stringify(messageToSend);

  connectedClients.forEach((client) => {
    try {
      sendText(client, jsonMessage);
    } catch (error) {
      console.error("Error sending to WebSocket client:", error);
      // Remove client if error occurs
      removeClient(client);
    }
  });

  console.log(
    `Message relayed from ${topic} to ${connectedClients.size} client(s)`
  );
});

mqttClient.on("error", (error) => {
  console.error("MQTT connection error:", error.message);
});

mqttClient.on("close", () => {
  console.log("MQTT connection closed");
});

mqttClient.on("offline", () => {
  console.log("MQTT client offline");
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
