#!/bin/sh

host="$1"
shift
cmd="$@"

echo "⏳ Waiting for Cassandra at $host..."

while ! nc -z $(echo "$host" | cut -d':' -f1) $(echo "$host" | cut -d':' -f2); do
  echo "⛔ Cassandra not available yet at $host, sleeping 2s..."
  sleep 2
done

echo "✅ Cassandra is available, starting service..."
exec $cmd
