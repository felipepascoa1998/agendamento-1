# Copilot Instructions for AI Agents

## Visão Geral da Arquitetura
- O projeto é dividido em dois principais diretórios: `backend/` (API Python) e `frontend/` (React).
- O backend expõe endpoints REST (veja `backend/server.py`) e utiliza dependências listadas em `backend/requirements.txt`.
- O frontend utiliza React com Tailwind CSS, plugins customizados e configuração via CRACO (`frontend/craco.config.js`).
- Comunicação entre frontend e backend é feita via HTTP (REST), endpoints definidos no backend.

## Fluxos de Desenvolvimento
- Para rodar o backend: `python backend/server.py` (verifique dependências em `requirements.txt`).
- Para rodar o frontend: `npm install` e depois `npm start` dentro de `frontend/`.
- Testes backend: execute `pytest` ou scripts em `backend_test.py`.
- Testes frontend: não há configuração explícita de testes, mas siga padrões React se necessário.

## Convenções e Padrões Específicos
- Componentes React ficam em `frontend/src/components/` e subpastas.
- Páginas React estão em `frontend/src/pages/`, separadas por contexto (`admin/`, `cliente/`).
- Plugins customizados do frontend ficam em `frontend/plugins/`.
- Hooks customizados em `frontend/src/hooks/`.
- Utilitários JS em `frontend/src/lib/utils.js`.
- O backend é monolítico, mas pode ser modularizado conforme crescer.

## Integrações e Dependências
- Frontend depende de Tailwind CSS, CRACO, e plugins customizados.
- Backend depende de pacotes Python listados em `backend/requirements.txt`.
- Comunicação entre frontend e backend é feita via REST, endpoints definidos em `backend/server.py`.

## Exemplos de Padrões Importantes
- Novo componente React: crie em `frontend/src/components/ui/` e siga exemplos existentes.
- Novo endpoint backend: adicione função em `backend/server.py` e documente no README.
- Novo plugin frontend: crie subpasta em `frontend/plugins/`.

## Outras Observações
- Documentação adicional pode estar em `README.md` ou `memory/PRD.md`.
- Siga a estrutura de pastas existente para manter organização.
- Atualize este arquivo se padrões mudarem.
