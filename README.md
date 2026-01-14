# SIGERD Mobile

Sistema Integrado de Gerenciamento de Riscos e Desastres - Versão Mobile

## 📱 Sobre o Projeto

Aplicativo mobile para a Defesa Civil de Santa Maria de Jetibá, desenvolvido com React + Vite, oferecendo funcionalidades offline-first para gestão de riscos e desastres.

## ✨ Funcionalidades

### 🔐 Autenticação
- Login seguro com Supabase Auth
- Gestão de perfis de usuários

### 📊 Dashboard
- Indicadores operacionais em tempo real
- Vistorias pendentes
- Ocorrências ativas
- Tempo médio de resposta
- Breakdown de tipos de vistoria

### 📝 Vistorias
- Formulário completo de inspeção
- Captura de fotos com conversão Base64
- Anexo de documentos
- Geolocalização automática
- Sincronização offline/online com Supabase

### ⚡ GeoRescue
- Busca em 21.510+ instalações elétricas
- Integração com Google Maps para navegação
- Mapa interativo com Leaflet
- Dados em tempo real do Supabase

### 📡 Monitoramento
- Acompanhamento de ocorrências
- Alertas em tempo real

## 🛠️ Tecnologias

- **Frontend**: React 18, Vite
- **Roteamento**: React Router DOM
- **Mapas**: Leaflet, React Leaflet
- **Banco de Dados**: Supabase (PostgreSQL)
- **Offline Storage**: IndexedDB (idb)
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React, FontAwesome
- **PWA**: Vite Plugin PWA

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

1. Clone o repositório:
\`\`\`bash
git clone <repository-url>
cd DEFESA_CIVIL_MOBILE
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Configure as variáveis de ambiente:
Crie um arquivo \`.env\` na raiz do projeto:
\`\`\`env
VITE_API_BASE_URL=http://localhost/sigerd/api
VITE_SUPABASE_URL=https://flsppiyjmcrjqulosrqs.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GEORESCUE_URL=https://miijkslcxxlxnbpxzlub.supabase.co
VITE_GEORESCUE_ANON_KEY=your_georescue_key_here
\`\`\`

4. Execute o projeto:
\`\`\`bash
npm run dev
\`\`\`

5. Acesse: http://localhost:5173

## 📦 Build para Produção

\`\`\`bash
npm run build
npm run preview
\`\`\`

## 🗄️ Estrutura do Banco de Dados

### Supabase - sigerd_mobile
- \`vistorias\`: Registros de inspeções
- \`tipos_vistoria\`: Categorias de vistoria
- \`profiles\`: Perfis de usuários

### Supabase - GeoRescue
- \`electrical_installations\`: 21.510 instalações elétricas

## 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Autenticação via Supabase Auth
- Dados sensíveis em variáveis de ambiente

## 📱 PWA

O aplicativo é configurado como Progressive Web App, permitindo:
- Instalação no dispositivo
- Funcionamento offline
- Sincronização em background

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit suas mudanças (\`git commit -m 'Add some AmazingFeature'\`)
4. Push para a branch (\`git push origin feature/AmazingFeature\`)
5. Abra um Pull Request

## 📄 Licença

© 2024 Defesa Civil de Santa Maria de Jetibá

## 🤝 Contato

Defesa Civil de Santa Maria de Jetibá
