# AISStream Downloader

[AISStream.io](https://aisstream.io/) の WebSocket API を使って、世界中の船舶 AIS データをリアルタイムに取得し、CSV ファイルとして保存するツールです。

## 機能

- AISStream WebSocket API に接続し、指定秒数分の AIS メッセージを収集
- PositionReport (位置情報) と ShipStaticData (船舶静的情報) を統合
- 収集した船舶データを CSV 形式で出力

## 出力フィールド

| フィールド | 説明 |
|---|---|
| mmsi | 海上移動業務識別番号 |
| name | 船名 |
| imo | IMO 番号 |
| lat / lon | 緯度 / 経度 |
| sog | 対地速力 (knots) |
| cog | 対地針路 (degrees) |
| nav_status | 航行状態 |
| ship_type | 船種 |
| destination | 目的地 |
| eta | 到着予定時刻 |
| dim_bow / dim_stern | 船首 / 船尾方向の長さ |
| timestamp | タイムスタンプ (UTC) |

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、AISStream の API キーを設定します。

```
AISSTREAM_API_KEY=your_api_key_here
```

API キーは [AISStream.io](https://aisstream.io/) で取得できます。

## 使い方

```bash
node index.js
```

実行すると、10 秒間 AIS データを収集し、`snapshot.csv` に保存します。
実行後、以下のような統計情報がコンソールに表示されます。

```
Collecting for 10s ...
Total vessels  : 1234
With position  : 987
Moving (>0.5kn): 456
Saved 1234 vessels → snapshot.csv
```

## テスト

`test/websocket_stream.js` は日本周辺 (緯度 30-45, 経度 120-150) の AIS ストリームを受信する動作確認用スクリプトです。

```bash
node test/websocket_stream.js
```
