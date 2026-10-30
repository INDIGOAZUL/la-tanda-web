#!/bin/sh
# Entrypoint of the alertmanager container. Keeps the webhook URL (a secret:
# anyone who has it can post to the channel) out of the config file.
set -eu

umask 077
printf '%s' "${ALERT_WEBHOOK_URL:-}" > /alertmanager/webhook_url

if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
  cp /etc/alertmanager/alertmanager.yml /alertmanager/alertmanager.yml
else
  echo "start.sh: ALERT_WEBHOOK_URL is empty, alerts are only shown in the Alertmanager UI" >&2
  sed 's/^  receiver: discord$/  receiver: none/; s/^      receiver: discord$/      receiver: none/' \
    /etc/alertmanager/alertmanager.yml > /alertmanager/alertmanager.yml
fi

exec /bin/alertmanager --config.file=/alertmanager/alertmanager.yml "$@"
