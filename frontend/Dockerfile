FROM node:22-alpine AS build
WORKDIR /workspace
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api
ARG VITE_STATIC_BASE_URL=
ARG VITE_FRONTEND_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_STATIC_BASE_URL=${VITE_STATIC_BASE_URL}
ENV VITE_FRONTEND_BASE_URL=${VITE_FRONTEND_BASE_URL}
RUN npm run build:h5

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/build/h5 /usr/share/nginx/html
EXPOSE 80
