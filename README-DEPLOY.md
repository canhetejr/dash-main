# Deploy no Coolify com Docker Compose

Esta aplicação está completamente otimizada para ser executada no seu servidor utilizando **Coolify**, aproveitando o Next.js `standalone` local output e processamento isolado Non-Root.

## Passos para Deploy

1. Acesse o painel do seu **Coolify** e adicione um novo Recurso (Resource).
2. Escolha **Docker Compose** e carregue este repositório via Github/Gitlab ou de forma local.
3. Se o repositório possuir webhook configurado (via Github App no Coolify), defina a Branch correta (`main` ou a respectiva de produção em uso).

### Configurar Variáveis de Ambiente

> [!WARNING]
> No painel do Coolify, navegue até a sub-seção **Environment Variables** do Serviço recém adicionado, e adicione obrigatoriamente (em plain / raw text) as seguintes chaves do seu caso de uso:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_RANGE` (ex: `TRATAMENTO!A:L`)
- `GOOGLE_SHEETS_MOODLE_BASE_RANGE` (ex: `BASE!A:B`)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `USE_MOCK_DATA` (Definir como `true` temporariamente caso queira subir antes pra ver se vaza a tela de forma mockada).
- `MOODLE_URL_TEMPLATE`

*Nota: As variáveis `PORT`, `NODE_ENV` e `NEXT_TELEMETRY_DISABLED` já estão predefinidas no `docker-compose.yml` e não requerem alteração.*

### Configuração de Rede & Volume

1. O serviço **não requer** banco de dados separado por container (usa conexão externa Google Sheets pelas envs).
2. A porta em que o container expõe o tráfego interno ao Coolify é a **`3000`**. O Coolify de forma nativa utilizará a Traefik para rotear seu Domínio Público setado no painel até esta porta.

4. Por fim, aperte no botão **Deploy** no Coolify. O runner orquestrará as 3 etapas de build de forma eficiente até ficar on-line.
