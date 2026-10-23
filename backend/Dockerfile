# Image de développement : le code est monté en volume, le serveur redémarre à chaque modification.
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
