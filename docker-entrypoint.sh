#!/bin/sh
set -eu

storage_root="${MEDIA_LOCAL_ROOT:-/app/storage/media}"

if [ "${MEDIA_STORAGE_DRIVER:-local}" = "local" ]; then
  case "$storage_root" in
    /app/storage/*)
      mkdir -p "$storage_root"
      chown -R nextjs:nodejs "$storage_root"
      ;;
    *)
      echo "MEDIA_LOCAL_ROOT trebuie să fie în /app/storage când se folosește imaginea Docker." >&2
      exit 1
      ;;
  esac
fi

exec su-exec nextjs:nodejs "$@"
