FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# Start the server (assuming full-stack setup)
CMD ["npm", "run", "start"]
