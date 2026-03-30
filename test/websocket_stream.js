import WebSocket from "ws";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// test/ の一つ上（プロジェクトルート）の .env を明示的に指定
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });


const API_KEY = process.env.AISSTREAM_API_KEY;

const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

if (!API_KEY) {
  console.error("ERROR: AISSTREAM_API_KEY is not set");
  process.exit(1);
}
console.log(`API_KEY: ${API_KEY.slice(0, 4)}${"*".repeat(API_KEY.length - 4)}`);


socket.on("open", () => {
  socket.send(JSON.stringify({
    APIKey: API_KEY,
    BoundingBoxes: [[[30, 120], [45, 150]]],  // 日本周辺
    FilterMessageTypes: ["PositionReport"],
  }));
});

socket.on("message", (data) => {
  const msg = JSON.parse(data);
  console.log(msg);
});

socket.on("error", (err) => console.error("WebSocket error:", err));
socket.on("close", () => console.log("Connection closed"));