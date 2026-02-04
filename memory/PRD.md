# Salon Scheduler SaaS - PRD

## Original Problem Statement
Sistema web completo de agendamento para salões de beleza, no modelo SaaS multi-tenant, onde cada cliente possui seu próprio domínio ou subdomínio.

Exemplos de clientes:
- thaifrancabeauty.seusistema.com (1 prestador – ela mesma)
- monicathails.seusistema.com (2 ou mais prestadores)

## User Personas

### Persona 1: Dona do Salão (Admin)
- Gerencia agenda, serviços e funcionários
- Visualiza relatórios de faturamento
- Bloqueia horários para folgas e reuniões

### Persona 2: Cliente Final
- Agenda horários online
- Visualiza e gerencia seus agendamentos
- Pode reagendar ou cancelar

## Core Requirements (Static)

### Multi-tenant Architecture
- Isolamento de dados por domínio/subdomínio
- Identificação automática do tenant pelo host
- Um único backend e banco de dados

### Camada Admin
- [x] Gerenciamento de Agendamentos (pendentes, próximos, concluídos)
- [x] Bloqueio de Horários (dia inteiro ou específicos)
- [x] Cadastro de Serviços (nome, duração, valor)
- [x] Cadastro de Funcionários/Prestadores
- [x] Relatórios (faturamento por período, serviço, funcionário)

### Camada Cliente
- [x] Agendar horário (escolher serviço, prestador, data, horário)
- [x] Reagendar/Cancelar
- [x] Consultar agendamentos

### Regras de Negócio
- [x] Um horário não pode ser agendado duas vezes
- [x] Bloqueios impedem novos agendamentos
- [x] Reagendamentos atualizam disponibilidade
- [x] Segurança por tenant (isolamento total)

## What's Been Implemented

### Date: 2026-02-04

**Backend (FastAPI + MongoDB)**
- Multi-tenant architecture with automatic tenant detection from host
- Google OAuth authentication via Emergent Auth
- Full CRUD for: Services, Employees, Blocked Times, Appointments
- Revenue reports with filtering by date range
- Available slots calculation for booking

**Frontend (React + Tailwind CSS)**
- Landing Page with services showcase and team section
- Login Page with Google OAuth
- Admin Dashboard with stats overview
- Admin Agenda with calendar view and filters
- Admin Serviços (CRUD)
- Admin Funcionários (CRUD)
- Admin Bloqueios (CRUD)
- Admin Relatórios (revenue by service/employee)
- Cliente Agendar (step-by-step booking flow)
- Cliente Meus Agendamentos (view, reschedule, cancel)

**Design System**
- Organic & Earthy theme (Deep Forest Green + Warm Beige)
- Playfair Display (headings) + Manrope (body)
- Modern UI with micro-animations
- Fully responsive (mobile + desktop)

## Prioritized Backlog

### P0 (Done)
- [x] Multi-tenant architecture
- [x] Authentication (Google OAuth)
- [x] Services CRUD
- [x] Employees CRUD
- [x] Appointments system
- [x] Blocked times
- [x] Reports

### P1 (Future)
- [ ] Email notifications for appointments
- [ ] SMS reminders via Twilio
- [ ] Payment integration (Stripe/PayPal)
- [ ] Online payment for services

### P2 (Future)
- [ ] Customer reviews/ratings
- [ ] Loyalty program
- [ ] Gift cards
- [ ] Multi-language support
- [ ] Custom domains management

## Next Tasks
1. Add sample data (services, employees) for demo
2. Test Google Auth flow end-to-end
3. Add email notifications (optional)
4. Configure custom domains (optional)
