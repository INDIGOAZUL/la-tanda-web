#!/bin/sh
# Entrypoint of the prometheus container: turns the comma-separated target lists
# from .env into file_sd JSON files, then starts Prometheus with the given flags.
# Prometheus re-reads these files on change, so editing them by hand also works
# until the next container restart.
set -eu

dir=/prometheus/targets
mkdir -p "$dir"

# $1 = file name, $2 = comma-separated host:port list (may be empty)
# Each target gets a "host" label, so Alertmanager can tell that a node's
# CometBFT, API and node_exporter targets belong to the same machine.
write_targets() {
  json=""
  for target in $(printf '%s' "$2" | tr ',' ' '); do
    case "$target" in
      *[!A-Za-z0-9.:_-]*)
        echo "render-targets: invalid target '$target' in $1 (expected host:port)" >&2
        exit 1
        ;;
    esac
    json="${json:+$json, }{\"targets\": [\"$target\"], \"labels\": {\"host\": \"${target%:*}\"}}"
  done
  printf '[%s]\n' "$json" > "$dir/$1.tmp"
  mv "$dir/$1.tmp" "$dir/$1"
  echo "render-targets: $1 -> ${2:-<none>}"
}

write_targets cometbft.json "${COMETBFT_TARGETS:-}"
write_targets cosmos-sdk.json "${COSMOS_API_TARGETS:-}"
write_targets node.json "${NODE_EXPORTER_TARGETS:-}"
write_targets latanda-exporter.json "${EXPORTER_TARGET:-}"
write_targets alertmanager.json "${ALERTMANAGER_TARGET:-}"

exec /bin/prometheus "$@"
