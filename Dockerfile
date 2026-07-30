# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate

FROM base AS dependencies
RUN apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=carteazilei-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are embedded in the browser bundle and are not secrets.
ARG NEXT_PUBLIC_SITE_URL=https://carteazilei.ro
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NODE_ENV=production
RUN pnpm build

# Next.js standalone tracing does not copy Sharp's platform-specific optional
# packages. Materialize the Alpine x64 runtime files so image uploads work in
# the final container as well as during the build.
FROM dependencies AS sharp-runtime
RUN mkdir -p /sharp-runtime/@img \
    && cp -LR node_modules/.pnpm/@img+sharp-linuxmusl-x64@0.35.3/node_modules/@img/sharp-linuxmusl-x64 /sharp-runtime/@img/sharp-linuxmusl-x64 \
    && cp -LR node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@1.3.2/node_modules/@img/sharp-libvips-linuxmusl-x64 /sharp-runtime/@img/sharp-libvips-linuxmusl-x64

# Build this target separately for single, one-off operational jobs such as
# migrations, taxonomy seeding and the initial administrator bootstrap.
# It deliberately contains development tooling; it is never the public app image.
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "db:migrate"]

FROM node:24-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat \
    su-exec \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV MEDIA_STORAGE_DRIVER=local
ENV MEDIA_LOCAL_ROOT=/app/storage/media

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=sharp-runtime --chown=nextjs:nodejs /sharp-runtime/@img ./node_modules/@img
RUN mkdir -p /app/storage/media && chown -R nextjs:nodejs /app/storage
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/carteazilei-entrypoint

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/local/bin/carteazilei-entrypoint"]
CMD ["node", "server.js"]
