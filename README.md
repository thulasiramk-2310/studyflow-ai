# StudyFlow AI

StudyFlow AI is an AI-powered collaborative learning platform. The platform allows organizers to create study groups, upload learning resources, conduct study sessions, and use AI to assist members.

## Architecture

* ✅ PostgreSQL Database
* ✅ Docker & Nginx API Gateway
* ✅ Playwright E2E Tests
* ✅ AI Document Ingestion (FAISS + LangChain)

## Progress

| Module      | Status |
| ----------- | :----: |
| UI          |    ✅   |
| Routing     |    ✅   |
| Auth        |    ✅   |
| API Gateway |    ✅   |
| Groups      |    ✅   |
| Resources   |    ✅   |
| Sessions    |    ✅   |
| Infra/E2E   |    ✅   |
| AI (Phase 1)|    ✅   |
| AI (RAG)    |    ⏳   |
| AWS         |    ⏳   |
| CI/CD       |    ⏳   |

StudyFlow AI uses a microservices architecture:
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Auth Service**: Spring Boot, Spring Security, JWT
- **Study Service**: FastAPI
- **AI Service**: FastAPI, LangChain, LangGraph, FAISS, Ollama

## Project Structure

- `frontend/` - React frontend application.
- `auth-service/` - Spring Boot authentication service.
- `study-service/` - FastAPI study service.
- `ai-service/` - FastAPI AI service.

## Running Locally

Instructions will be added as services are implemented.
