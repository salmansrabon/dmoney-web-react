FROM node:24-slim

WORKDIR /app

# Dependencies first so this layer stays cached until package*.json changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Real .env* files are excluded by .dockerignore (they can point at production).
# Next.js reads .env during the build, so start from the committed example.
RUN cp .env.example .env

# NEXT_PUBLIC_* values are baked into the browser bundle at build time.
# A build arg overrides the .env.example value only when it is not empty.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SECRET_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RUN env \
      ${NEXT_PUBLIC_API_URL:+NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL} \
      ${NEXT_PUBLIC_SECRET_KEY:+NEXT_PUBLIC_SECRET_KEY=$NEXT_PUBLIC_SECRET_KEY} \
      ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:+NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} \
      npx next build --turbopack

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
