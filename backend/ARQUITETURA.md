# Estrutura modularizada sugerida para o backend FastAPI

backend/
├── server.py              # Inicialização do app, middlewares, routers
├── models/                # Modelos Pydantic e schemas
│   └── tenant.py
├── routes/                # Rotas organizadas por domínio
│   └── tenant.py
├── services/              # Lógica de negócio e integração externa
│   └── tenant_service.py
├── utils/                 # Funções utilitárias, helpers
│   └── email.py
└── requirements.txt

## Recomendações:
- Separe cada domínio (ex: agendamento, usuário, serviço) em arquivos próprios dentro de `models/`, `routes/` e `services/`.
- `server.py` deve apenas inicializar o app, registrar middlewares e incluir routers.
- Use `services/` para lógica de negócio e integrações (ex: envio de e-mail, acesso ao banco).
- `utils/` para funções auxiliares reutilizáveis.
- Exemplo de importação de router:

```python
from routes.tenant import router as tenant_router
app.include_router(tenant_router)
```

- Exemplo de modelo:
```python
# models/tenant.py
from pydantic import BaseModel
class TenantBase(BaseModel):
    name: str
    slug: str
```

- Exemplo de rota:
```python
# routes/tenant.py
from fastapi import APIRouter
router = APIRouter()
@router.get("/tenants")
def list_tenants():
    ...
```

- Exemplo de service:
```python
# services/tenant_service.py
def get_tenants(db):
    ...
```
