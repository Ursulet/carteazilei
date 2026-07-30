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

# Next.js traces the Sharp JavaScript package and its native Alpine binary into
# the standalone output, but it does not always trace the separately packaged
# libvips shared libraries. Copy only those missing packages and rebuild their
# pnpm links. This keeps image uploads working without duplicating the complete
# production node_modules tree in the final image.
RUN set -eux; \
    for pair in "0.34.5:1.2.4" "0.35.3:1.3.2"; do \
      sharp_version="${pair%%:*}"; \
      libvips_version="${pair##*:}"; \
      libvips_package="@img+sharp-libvips-linuxmusl-x64@${libvips_version}"; \
      libvips_source="node_modules/.pnpm/${libvips_package}/node_modules/@img/sharp-libvips-linuxmusl-x64"; \
      libvips_target=".next/standalone/node_modules/.pnpm/${libvips_package}/node_modules/@img"; \
      test -d "${libvips_source}"; \
      mkdir -p "${libvips_target}"; \
      cp -a "${libvips_source}" "${libvips_target}/"; \
      for package_dir in \
        .next/standalone/node_modules/.pnpm/sharp@${sharp_version}* \
        .next/standalone/node_modules/.pnpm/@img+sharp-linuxmusl-x64@${sharp_version}; do \
        if [ -d "${package_dir}" ]; then \
          mkdir -p "${package_dir}/node_modules/@img"; \
          ln -sfn \
            "../../../${libvips_package}/node_modules/@img/sharp-libvips-linuxmusl-x64" \
            "${package_dir}/node_modules/@img/sharp-libvips-linuxmusl-x64"; \
        fi; \
      done; \
    done

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
RUN mkdir -p /app/storage/media && chown -R nextjs:nodejs /app/storage
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/carteazilei-entrypoint

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/local/bin/carteazilei-entrypoint"]
CMD ["node", "server.js"]
