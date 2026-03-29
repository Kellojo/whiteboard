FROM node:25-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
ENV BODY_SIZE_LIMIT=0

EXPOSE 3000
VOLUME ["/app/.whiteboards"]

CMD ["node", "build"]
