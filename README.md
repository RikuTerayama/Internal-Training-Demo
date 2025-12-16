# 内部研修デモアプリケーション

FastAPIで実装された、4択ケース学習と研修運用管理のモックWebアプリケーションです。

## 技術スタック

- Python 3.13
- FastAPI
- Uvicorn
- Jinja2（サーバーサイドレンダリング）
- インメモリ保存（データベース不要）

## ローカル起動手順

1. 依存パッケージのインストール
```bash
pip install -r requirements.txt
```

2. アプリケーションの起動
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. ブラウザでアクセス
- http://localhost:8000

## 画面URL一覧

### 受講者向け画面

- `GET /` - 名前入力とテーマ選択
- `GET /quiz/{topic}?name={name}` - 4択設問表示（topic: governance / harassment / infosec）
- `POST /quiz/{topic}` - 回答送信
- `GET /result/{topic}?name={name}` - スコアと誤答一覧

### 管理者向け画面

- `GET /admin` - 受講者一覧と集計情報
- `GET /admin/remind` - リマインド送信フォーム
- `POST /admin/remind` - リマインド実行
- `GET /admin/logs` - 通知ログ一覧

## Renderでのデプロイ

### Start Command

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 環境変数

特に必要な環境変数はありません。

## 注意事項

⚠️ **重要**: このアプリケーションはインメモリでデータを保存しています。サーバーを再起動すると、すべてのデータ（受講者の進捗、回答、通知ログなど）が消去されます。デモ用途として使用してください。

## データ構造

- **テーマ**: governance（ガバナンス）、harassment（ハラスメント）、infosec（情報セキュリティ）
- **設問数**: 各テーマ3問ずつ、合計9問
- **保存データ**: ユーザー進捗、回答履歴、スコア、通知ログ

