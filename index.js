import WebSocket from "ws";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createWriteStream } from "fs";
import { stringify } from "csv-stringify";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "./.env") });

const API_KEY = process.env.AISSTREAM_API_KEY;
if (!API_KEY) {
  console.error("ERROR: AISSTREAM_API_KEY is not set");
  process.exit(1);
}

const FIELDS = [
  "mmsi", "name", "imo", "lat", "lon",
  "sog", "cog", "nav_status",
  "ship_type", "destination", "eta",
  "dim_bow", "dim_stern", "timestamp",
];

function snapshot(durationSec = 10) {
  return new Promise((resolve) => {
    const vessels = {};
    const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

    socket.on("open", () => {
      socket.send(JSON.stringify({
        APIKey: API_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport", "ShipStaticData"],
      }));
      console.log(`Collecting for ${durationSec}s ...`);
    });

    socket.on("message", (data) => {
      const msg = JSON.parse(data);
      const meta = msg.MetaData ?? {};
      const mmsi = String(meta.MMSI ?? "");
      if (!mmsi) return;

      if (!vessels[mmsi]) vessels[mmsi] = {};

      const msgType = msg.MessageType;

      if (msgType === "PositionReport") {
        const pr = msg.Message.PositionReport;
        Object.assign(vessels[mmsi], {
          mmsi,
          name: (meta.ShipName ?? "").trim(),
          lat: meta.latitude,
          lon: meta.longitude,
          sog: pr.Sog,
          cog: pr.Cog,
          nav_status: pr.NavigationalStatus,
          timestamp: meta.time_utc,
        });

      } else if (msgType === "ShipStaticData") {
        const ssd = msg.Message.ShipStaticData;
        Object.assign(vessels[mmsi], {
          mmsi,
          name: (ssd.Name ?? "").trim() || (meta.ShipName ?? "").trim(),
          imo: ssd.ImoNumber,
          ship_type: ssd.Type,
          destination: (ssd.Destination ?? "").trim(),
          eta: ssd.Eta,
          dim_bow: ssd.Dimension?.A,
          dim_stern: ssd.Dimension?.B,
        });
      }
    });

    socket.on("error", (err) => console.error("WebSocket error:", err));

    // 指定秒数後に接続を閉じて結果を返す
    setTimeout(() => {
      socket.close();
      resolve(vessels);
    }, durationSec * 1000);
  });
}

function saveCsv(vessels, path = "snapshot.csv") {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(path, { encoding: "utf-8" });
    const stringifier = stringify({ header: true, columns: FIELDS });

    stringifier.pipe(output);

    for (const v of Object.values(vessels)) {
      // FIELDS にないキーを除外
      const row = Object.fromEntries(FIELDS.map((f) => [f, v[f] ?? ""]));
      stringifier.write(row);
    }

    stringifier.end();
    output.on("finish", () => {
      console.log(`Saved ${Object.keys(vessels).length} vessels → ${path}`);
      resolve();
    });
    output.on("error", reject);
  });
}

// main
const vessels = await snapshot(10);

const withPos = Object.values(vessels).filter((v) => v.lat);
const moving  = withPos.filter((v) => (v.sog ?? 0) > 0.5);
console.log(`Total vessels  : ${Object.keys(vessels).length}`);
console.log(`With position  : ${withPos.length}`);
console.log(`Moving (>0.5kn): ${moving.length}`);

await saveCsv(vessels);