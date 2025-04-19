FROM node:23.11.0-alpine

WORKDIR /app


COPY package*.json .
COPY tsconfig*.json .
COPY vite.config.ts .


ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm install

COPY . .


EXPOSE 5173


CMD ["npm", "run", "dev"]