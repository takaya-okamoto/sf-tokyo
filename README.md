# ユーザーヒアリングプラットフォーム

企業がユーザーにサービスを試用してもらい、録画・ログ収集とAIチャットでフィードバックを収集するプラットフォームです。

## 技術スタック

| 領域 | 技術 |
|------|------|
| モノレポ | Turborepo + pnpm workspaces |
| フロントエンド | Next.js 15 (App Router, Turbopack) |
| バックエンド | Supabase (PostgreSQL, Auth, Storage) |
| UI | shadcn/ui + Tailwind CSS |
| AIチャット | Vercel AI SDK + OpenAI (Phase 2) |

## プロジェクト構造

```
sftokyo/
├── apps/
│   ├── company/          # 企業向けアプリ（ポート3001）
│   └── user/             # ユーザー向けアプリ（ポート3000）
├── packages/
│   ├── ui/               # 共通UIコンポーネント（shadcn/ui）
│   ├── database/         # Supabase型定義
│   └── supabase/         # 共通Supabaseクライアント
└── supabase/
    └── migrations/       # DBマイグレーション
```

## 必要な環境

- Node.js 18以上
- pnpm 9以上
- Docker（Supabase Local Development用）
- Supabase CLI

## セットアップ手順

### 1. 依存関係のインストール

```bash
pnpm install
```

> **注意**: Supabase CLIは依存関係として含まれているため、自動的にインストールされます。
> Docker Desktop、Rancher Desktop、またはPodmanが必要です。

### 2. Supabase ローカル環境の起動

```bash
# Supabaseのローカル環境を起動（Dockerが必要）
# マイグレーションは自動的に適用されます
pnpm db:start
```

起動が完了すると、以下の情報が表示されます：

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   S3 Access Key: ...
   S3 Secret Key: ...
       S3 Region: local
```

### 3. 環境変数の設定

各アプリディレクトリに `.env.local` ファイルを作成します。

**apps/company/.env.local** と **apps/user/.env.local**:

```bash
# Supabase設定（supabase startで表示された値を使用）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# オプション：サービスロールキー（サーバーサイドのみ）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

または、ルートディレクトリに `.env.local` を作成してシンボリックリンクを張ることもできます。

### 4. 開発サーバーの起動

```bash
# 両方のアプリを同時に起動
pnpm dev
```

- **企業向けアプリ**: http://localhost:3001
- **ユーザー向けアプリ**: http://localhost:3002
- **Supabase Studio**: http://localhost:54323

## アカウント登録とサインイン

### 企業アカウント

1. http://localhost:3001/signup にアクセス
2. 以下の情報を入力：
   - 会社名
   - メールアドレス
   - パスワード（6文字以上）
3. 「アカウント作成」ボタンをクリック
4. 自動的にダッシュボードにリダイレクトされます

### ユーザーアカウント

1. http://localhost:3002/signup にアクセス
2. 以下の情報を入力：
   - 表示名
   - メールアドレス
   - パスワード（6文字以上）
3. 「アカウント作成」ボタンをクリック
4. 自動的にホーム画面にリダイレクトされます

### サインイン

- **企業**: http://localhost:3001/login
- **ユーザー**: http://localhost:3002/login

メールアドレスとパスワードでログインできます。

### メール確認について

ローカル開発環境では、メール確認は無効化されています。
本番環境では、Supabaseのダッシュボードでメール設定を行う必要があります。

ローカルで送信されたメールは、Inbucket (http://localhost:54324) で確認できます。

## 主な機能

### 企業向けアプリ (localhost:3001)

| ページ | 説明 |
|--------|------|
| `/` | ダッシュボード - 統計と最近のセッション |
| `/hearings` | ヒアリング一覧 - 作成・編集・管理 |
| `/hearings/new` | 新規ヒアリング作成 |
| `/hearings/[id]` | ヒアリング編集 |
| `/hearings/[id]/results` | セッション結果一覧 |
| `/results` | 全セッション結果 |
| `/results/[sessionId]` | セッション詳細（録画・ログ・AI要約） |
| `/settings` | 企業設定 |
| `/settings/team` | チームメンバー管理 |

### ユーザー向けアプリ (localhost:3000)

| ページ | 説明 |
|--------|------|
| `/` | ヒアリング一覧 - 参加可能なヒアリング |
| `/requests/[id]` | ヒアリング詳細・参加 |
| `/session/[id]` | セッション開始前の確認 |
| `/session/[id]/recording` | 録画中画面 |
| `/interview/[id]` | AIチャットインタビュー |
| `/history` | 参加履歴 |
| `/profile` | プロフィール設定 |

## データベーススキーマ

### 主要テーブル

| テーブル | 説明 |
|----------|------|
| `profiles` | ユーザープロファイル（auth.usersを拡張） |
| `companies` | 企業情報 |
| `company_members` | 企業メンバー（複数ユーザー対応） |
| `hearing_requests` | ヒアリング依頼 |
| `interview_sessions` | インタビューセッション |
| `recordings` | 録画データ |
| `event_logs` | イベントログ（click, scroll等） |
| `ai_interview_messages` | AIチャットメッセージ |
| `ai_interview_summaries` | AI要約 |

### Enum定義

```sql
-- ユーザーロール
CREATE TYPE user_role AS ENUM ('user', 'company', 'admin');

-- ヒアリングステータス
CREATE TYPE hearing_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

-- セッションステータス
CREATE TYPE session_status AS ENUM ('pending', 'recording', 'interview', 'completed', 'cancelled');
```

## Supabase Studio

ローカル環境では http://localhost:54323 でSupabase Studioにアクセスできます。

### 主な機能

- **Table Editor**: テーブルデータの閲覧・編集
- **SQL Editor**: SQLクエリの実行
- **Authentication**: ユーザー管理
- **Storage**: ファイルストレージ管理
- **Logs**: アプリケーションログ

## 便利なコマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# Supabase起動
pnpm db:start

# Supabase停止
pnpm db:stop

# Supabaseステータス確認
pnpm db:status

# データベースリセット（マイグレーション再適用）
pnpm db:reset

# 型定義生成
pnpm db:types
```

## トラブルシューティング

### Supabaseが起動しない

```bash
# Dockerが起動していることを確認
docker ps

# Supabaseをリセット
pnpm db:stop
pnpm db:start
```

### データベースをリセットしたい

```bash
# 全てのデータを削除してマイグレーションを再適用
pnpm db:reset
```

### 型エラーが発生する

```bash
# 型定義を再生成
pnpm db:types
```

### ログインできない

1. Supabase Studioで `profiles` テーブルを確認
2. ユーザーの `role` が正しいか確認（企業: `company`, ユーザー: `user`）
3. 必要に応じてデータを修正

## 本番環境へのデプロイ

### Supabaseプロジェクトの作成

1. https://supabase.com でプロジェクトを作成
2. プロジェクトのURLとanon keyを取得
3. 環境変数を本番用に設定

### Vercelへのデプロイ

```bash
# Vercel CLIでデプロイ
vercel
```

環境変数を設定：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ライセンス

MIT
