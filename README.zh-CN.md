# EasyHeadscaleAdmin

[English README](./README.md)

EasyHeadscaleAdmin 是一个基于 Next.js 15、TypeScript、Tailwind CSS、Prisma 和 SQLite 构建的现代化自托管 Headscale 管理后台。项目优先面向可上线的 MVP，同时为多实例、RBAC、OIDC、审计等能力预留清晰扩展空间。

## 项目亮点

- 真实可用的 Headscale 管理后台，不是静态演示
- 所有 Headscale API 调用都由服务端代理，浏览器不暴露 API Key
- 使用 Prisma + SQLite 保存本地配置，并对敏感配置做加密存储
- 提供仪表盘、用户、节点、预授权密钥、API 密钥、路由、设置等核心页面
- 支持管理员登录
- 支持 Docker 与 1Panel 部署
- 支持英文与简体中文界面

## 接管 Tailscale 官方客户端注册

本项目可以接管 **Tailscale 官方客户端在 Headscale 下的 Web 注册审批页面**。

这意味着：

- Tailscale 客户端仍然访问标准的 Headscale 注册链接
- Headscale 公网域名仍然继续提供正常的 Headscale 控制面服务
- EasyHeadscaleAdmin 可以接管 `/register/<token>` 页面、登录和审批流程
- 登录后可以在 UI 中选择 Headscale 用户并审批待注册节点

当前项目中的注册实现，已经按实际 Swagger 定义适配到这条接口：

- `POST /api/v1/node/register?user=<用户名>&key=<token>`

### 反向代理配置

如果你的 Headscale 已经在反向代理之后运行，只需要把 `/register/` 路径转交给 EasyHeadscaleAdmin 即可：

```nginx
location ^~ /register/ {
    return 301 https://your-domain-name$request_uri;
}
```

典型部署方式：

1. `Headscale` 继续在自己的内网地址上提供控制面能力
2. 公网 Headscale 域名继续服务正常客户端协议流量
3. 仅把 `/register/*` 这部分流量重定向或反代给 EasyHeadscaleAdmin
4. EasyHeadscaleAdmin 负责官方 Tailscale 客户端注册页面的登录和节点审批

注意：

- 这里接管的是 **注册审批页面**
- 这里只替换 `/register/*` 这部分 Web 审批页面
- 不是完整替代 Headscale 控制面协议
- 客户端心跳、Map 更新、控制面长连接等仍然应该由 Headscale 自身处理

## MVP 功能

- Headscale 初始化配置：服务地址 + API Key 校验与安全保存
- 仪表盘与健康状态
- 用户管理
- 节点管理
- 预授权密钥管理
- API 密钥管理
- 路由管理
- 设置页面
- ACL、DNS、DERP、审计日志页面

## 技术栈

- Next.js 15 App Router
- TypeScript
- React 19
- Tailwind CSS
- shadcn 风格 UI 组件结构
- TanStack Query
- TanStack Table
- React Hook Form + Zod
- Prisma + SQLite
- Docker + docker-compose

## 项目结构

```text
app/
  (protected)/
  api/
  setup/
components/
  layout/
  shared/
  ui/
features/
  dashboard/
  users/
  nodes/
  preauthkeys/
  apikeys/
  routes/
  settings/
lib/
  api.ts
  env.ts
  errors.ts
  forms/
  headscale/
server/
  config-service.ts
  crypto.ts
  db.ts
prisma/
  schema.prisma
  migrations/
```

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

主要变量说明：

- `DATABASE_URL`：本地 SQLite 数据库路径
- `APP_ENCRYPTION_KEY`：用于加密保存 Headscale API Key
- `AUTH_SESSION_SECRET`：用于签名管理员会话 Cookie
- `ADMIN_USERNAME`：管理员用户名
- `ADMIN_PASSWORD_HASH`：管理员密码密文
- `PORT`：监听端口
- `NEXT_PUBLIC_BASE_PATH`：可选，部署在二级目录时使用，例如 `/admin` 或 `/register`

### 3. 初始化数据库

```bash
pnpm db:deploy
```

### 4. 生成管理员密码密文

```bash
pnpm auth:hash '你的密码'
```

如果要验证当前 `.env` 中的密文是否匹配输入密码：

```bash
pnpm auth:verify '你的密码'
```

### 5. 启动开发环境

```bash
pnpm dev
```

然后打开 [http://localhost:3000](http://localhost:3000)。

## 生产构建

```bash
pnpm build
pnpm start
```

## 根路径 / 二级目录部署

本项目支持部署在根路径，也支持部署在二级目录，但 **basePath 是构建期配置**。

根路径部署：

```bash
./build.sh
```

二级目录部署：

```bash
NEXT_PUBLIC_BASE_PATH="/register" ./build.sh
```

说明：

- 根路径部署时保持 `NEXT_PUBLIC_BASE_PATH` 为空即可
- 修改 `NEXT_PUBLIC_BASE_PATH` 后需要重新构建
- 设置后，页面路由、静态资源和内部 API 请求都会自动带上对应前缀

## Docker 部署

### docker-compose

```bash
APP_ENCRYPTION_KEY="替换为高强度随机密钥" docker compose up -d --build
```

### Docker

```bash
docker build -t easy-headscale-admin .
docker run -d \
  --name easy-headscale-admin \
  -p 3000:3000 \
  -e DATABASE_URL="file:./dev.db" \
  -e APP_ENCRYPTION_KEY="替换为高强度随机密钥" \
  -e AUTH_SESSION_SECRET="替换为另一段高强度随机密钥" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD_HASH="替换为 pnpm auth:hash 的输出" \
  easy-headscale-admin
```

## 1Panel 部署

本项目支持在 `1panel/node:25.8.0` 这类 Node 运行环境中部署。

先生成运行目录：

```bash
./build.sh
```

输出目录：

```text
dist/1panel-node
```

推荐配置：

- 源码目录：生成后的运行目录，例如 `/app`
- 启动命令：`node server.js`
- 运行端口：与 `.env` 中的 `PORT` 保持一致

首次启动时，运行包装器会自动：

1. 加载 `.env`
2. 如果缺少依赖则执行安装
3. 执行 Prisma 迁移
4. 创建 `.db-deploy.done`
5. 启动 Next.js

## 安全说明

- 浏览器不会直接请求 Headscale
- Headscale API Key 只保留在服务端
- 所有写操作都通过 Zod 校验
- 管理员密码以密码哈希形式保存
- 本地系统状态与 Headscale 业务数据分离

## Headscale API 说明

- 项目通过统一的服务端客户端访问 Headscale
- 请求和错误处理集中封装
- 路由相关逻辑在必要处做了兼容处理
- 当前 Web 注册审批流程基于已验证的 `POST /api/v1/node/register` 实现

## 示例数据流

1. 管理员在 `/setup` 填写 Headscale 地址和 API Key
2. 服务端校验连接
3. API Key 加密后写入 SQLite
4. 受保护页面从本地配置读取连接信息
5. 服务端创建 Headscale Client
6. 前端页面只请求本项目自己的 `/api/*`