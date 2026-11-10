FROM node:24-bookworm-slim
WORKDIR /app
RUN npm install --global pnpm@10
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && mkdir -p /var/lib/la-nave && chown node:node /var/lib/la-nave
ENV NODE_ENV=production
ENV DATA_DIR=/var/lib/la-nave
ENV PORT=3210
USER node
EXPOSE 3210
CMD ["node", "--experimental-strip-types", "server/index.ts"]
