#!/bin/sh

set -eu
umask 077

deploy_path=${1:?Deployment path is required}
auth_api_image=${2:?Auth API image is required}
web_image=${3:?Web image is required}

if ! printf '%s\n' "$auth_api_image" |
  grep -Eq '^ghcr\.io/gena-tokarev/focoris-auth-api@sha256:[0-9a-f]{64}$'; then
  echo "Invalid auth API image reference." >&2
  exit 1
fi

if ! printf '%s\n' "$web_image" |
  grep -Eq '^ghcr\.io/gena-tokarev/focoris-web@sha256:[0-9a-f]{64}$'; then
  echo "Invalid web image reference." >&2
  exit 1
fi

cd "$deploy_path"

if [ ! -f .env ]; then
  echo "Missing $deploy_path/.env." >&2
  exit 1
fi

required_keys='
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
DATABASE_URL
REDIS_URL
AUTH_ACCESS_TOKEN_SECRET
AUTH_REFRESH_TOKEN_SECRET
AUTH_ACCESS_TOKEN_TTL_SECONDS
AUTH_REFRESH_TOKEN_TTL_SECONDS
AUTH_EXTERNAL_AUTH_STATE_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
GOOGLE_ALLOWED_WEB_REDIRECT_URIS
PASSKEY_RP_ID
PASSKEY_RP_NAME
PASSKEY_ALLOWED_ORIGINS
WEB_APP_ORIGIN
AUTH_API_URL
'

for key in $required_keys; do
  if ! grep -Eq "^${key}=.+$" .env; then
    echo "Missing or empty required key in .env: $key" >&2
    exit 1
  fi
done

docker network inspect shared_proxy >/dev/null
docker volume inspect focoris_postgres_data >/dev/null

release_file=.release.env.next
previous_file=.release.env.previous

printf 'AUTH_API_IMAGE=%s\nWEB_IMAGE=%s\n' \
  "$auth_api_image" \
  "$web_image" >"$release_file"

compose() {
  environment_file=$1
  shift
  docker compose \
    --env-file .env \
    --env-file "$environment_file" \
    -f compose.development.yml \
    "$@"
}

compose "$release_file" config --quiet
compose "$release_file" pull auth-api web
compose "$release_file" up -d --wait --wait-timeout 120 postgres redis

if ! compose "$release_file" run --rm --no-deps auth-api \
  node /app/node_modules/prisma/build/index.js migrate deploy \
  --schema /app/apps/auth-api/prisma/schema.prisma; then
  echo "Database migration failed; the running application was not replaced." >&2
  compose "$release_file" ps >&2 || true
  exit 1
fi

if [ -f .release.env ]; then
  cp .release.env "$previous_file"
else
  rm -f "$previous_file"
fi

if compose "$release_file" up -d --remove-orphans --wait --wait-timeout 120; then
  mv "$release_file" .release.env
  docker compose \
    --env-file .env \
    --env-file .release.env \
    -f compose.development.yml \
    ps
  exit 0
fi

echo "Deployment failed. Recent service state and logs follow." >&2
compose "$release_file" ps >&2 || true
compose "$release_file" logs --tail=200 auth-api web >&2 || true

if [ -f "$previous_file" ]; then
  echo "Restoring the previous application images." >&2
  if compose "$previous_file" up -d --remove-orphans --wait --wait-timeout 120; then
    cp "$previous_file" .release.env
    echo "Application rollback succeeded; database migrations were not reversed." >&2
  else
    echo "Automatic application rollback failed." >&2
    compose "$previous_file" ps >&2 || true
    compose "$previous_file" logs --tail=200 auth-api web >&2 || true
  fi
else
  echo "No previous release is available for automatic rollback." >&2
fi

exit 1
