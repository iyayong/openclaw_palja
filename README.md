# openclaw_palja
echo "http://127.0.0.1:18789/chat?session=main#token=$(jq -r '.gateway.auth.token' ~/.openclaw/openclaw.json)"