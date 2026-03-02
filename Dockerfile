FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache \
    android-tools \
    ffmpeg

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 8080

ENV NODE_ENV=production
ENV DEVICE_ID=localhost:5555
ENV PORT=8080

CMD ["npm", "start"]
