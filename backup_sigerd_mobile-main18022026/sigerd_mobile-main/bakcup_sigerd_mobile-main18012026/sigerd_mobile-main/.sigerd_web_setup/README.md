# SIGERD Web - Guia de Instalação

## Estrutura Criada

Todos os arquivos necessários foram criados no diretório:
```
c:\Users\user\Desktop\DEFESA_CIVIL_MOBILE\.sigerd_web_setup\
```

## Passos para Inicialização

### 1. Copiar arquivos para SIGERD_WEB

Copie todos os arquivos da pasta `.sigerd_web_setup` para a pasta `c:\Users\user\Desktop\SIGERD_WEB`:

```powershell
# No PowerShell
Copy-Item -Path "c:\Users\user\Desktop\DEFESA_CIVIL_MOBILE\.sigerd_web_setup\*" -Destination "c:\Users\user\Desktop\SIGERD_WEB" -Recurse -Force
```

### 2. Criar arquivo .env

Crie o arquivo `.env` na raiz do projeto SIGERD_WEB com o mesmo conteúdo do mobile:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_GEORESCUE_URL=https://miijkslcxxlxnbpxzlub.supabase.co
VITE_GEORESCUE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Instalar dependências

```powershell
cd c:\Users\user\Desktop\SIGERD_WEB
npm install
```

### 4. Iniciar o servidor de desenvolvimento

```powershell
npm run dev
```

O projeto estará disponível em: **http://localhost:3001**

## Estrutura do Projeto

```
SIGERD_WEB/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── OperationsMap.jsx
│   │   ├── FleetManagement.jsx
│   │   └── ShelterManagement.jsx
│   ├── services/
│   │   └── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Próximos Passos de Desenvolvimento

1. **Mapa de Operações**: Integrar react-leaflet para visualização completa
2. **Gestão de Frota**: Implementar CRUD de veículos e mobilizações
3. **Gestão de Abrigos**: Desenvolver controle de ocupação e recursos
4. **SCO**: Sistema de Comando de Operações com níveis de alerta

## Notas Importantes

- O projeto usa a **porta 3001** para não conflitar com o mobile (porta 5173)
- As credenciais do Supabase são compartilhadas entre Mobile e Web
- O design mantém a mesma linguagem visual do mobile para consistência da marca
