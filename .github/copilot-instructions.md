
# Copilot Instructions for AI Agents

## Big Picture & Arquitetura
- Projeto fullstack: `backend/` (FastAPI + MongoDB, multi-tenant, REST) e `frontend/` (React + Tailwind CSS, CRACO, design system customizado).
- Backend modularizado: cada domínio (agendamento, usuário, serviço, etc) tem `models/`, `routes/`, `services/`, `utils/`.
- Frontend organizado por contexto: componentes reutilizáveis em `src/components/ui/`, páginas em `src/pages/admin/`, `src/pages/cliente/`, hooks em `src/hooks/`.
- Comunicação sempre via REST, endpoints versionados sob `/api`.
- Autenticação padrão: Google OAuth (produção) ou sessão manual (dev, ver `auth_testing.md`).

## Workflows Essenciais
- **Backend:**
	- Rodar: `uvicorn backend.server:app --reload` (ou `python backend/server.py`)
	- Testar: `pytest` ou `python backend_test.py http://localhost:8000`
	- Modularização: adicione rotas em `routes/`, lógica em `services/`, helpers em `utils/`.
- **Frontend:**
	- Rodar: `npm install` + `npm start` (usa CRACO, plugins customizados)
	- Testar: scripts em `package.json` (`npm test`)
	- Plugins customizados: ativados/desativados em `craco.config.js`.
- **Dados de teste:**
	- Use `auth_testing.md` para criar usuários/sessões fake e autenticar localmente via cookie.

## Convenções e Padrões do Projeto
- **Backend:**
	- Cada domínio tem: `models/<dominio>.py`, `routes/<dominio>.py`, `services/<dominio>_service.py`.
	- Funções utilitárias em `utils/` (ex: `auth.py`, `email.py`).
	- Middlewares e inicialização em `server.py`.
	- Exemplo de importação de router:
		```python
		from routes.tenant import router as tenant_router
		app.include_router(tenant_router)
		```
- **Frontend:**
	- Componentes UI: `src/components/ui/`
	- Hooks: `src/hooks/`
	- Utilitários: `src/lib/utils.js`
	- Plugins: `frontend/plugins/` (ex: health-check, visual-edits)
	- Design system: siga `design_guidelines.json` para cores, fontes, spacing, etc.
	- Use named exports para componentes.

## Integrações e Pontos de Atenção
- **Autenticação:**
	- Google OAuth em produção (ver fluxo em `memory/PRD.md`).
	- Para dev/local, use sessão manual (`auth_testing.md`).
- **CORS:**
	- Backend já libera CORS para dev (`*`).
- **Plugins customizados:**
	- Plugins Babel/Webpack podem ser desativados em `craco.config.js` se causarem erro.
- **Testes e status:**
	- Use `test_result.md` para rastrear progresso, stuck tasks e comunicação entre agentes.

## Exemplos de Padrões Importantes
- Novo componente React: crie em `frontend/src/components/ui/` e siga exemplos existentes.
- Novo endpoint backend: crie rota em `routes/`, lógica em `services/`, modelo em `models/`.
- Novo plugin frontend: crie subpasta em `frontend/plugins/` e registre no `craco.config.js`.
- Para dados de teste, siga exemplos de `auth_testing.md`.

## Outras Observações
- Documentação adicional: `README.md`, `memory/PRD.md`, `backend/ARQUITETURA.md`, `design_guidelines.json`.
- Siga a estrutura de pastas existente para manter organização.
- Atualize este arquivo se padrões mudarem ou novas integrações forem criadas.
