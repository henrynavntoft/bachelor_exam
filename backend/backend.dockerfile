# Use official Node image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install all backend dependencies inside container
RUN npm install

# Copy prisma folder
COPY prisma ./prisma

# Copy the rest of your backend code
COPY . .

# Expose backend ports
EXPOSE 4000
EXPOSE 5555

# Use entrypoint script to decide dev/prod
ENTRYPOINT ["sh", "entrypoint.sh"]