# StudyFlow AI

StudyFlow AI is an AI-powered collaborative learning platform. The platform allows organizers to create study groups, upload learning resources, conduct study sessions, and use AI to assist members.

## 1. Project Overview
StudyFlow AI is a robust microservices platform that provides a complete end-to-end learning lifecycle—from goal setting and path creation, to resource indexing, AI assistance, and session planning.

## 2. Features
- Group collaboration and management.
- Dynamic Learning Path tracking.
- Resource uploading and management.
- AI Document Indexing (FAISS) for Retrieval-Augmented Generation (RAG).
- AI-driven study sessions, quizzes, and flashcards.
- Real-time updates and notifications.

## 3. Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **API Gateway**: Nginx
- **Auth Service**: Spring Boot, Spring Security, JWT
- **Study Service**: FastAPI
- **AI Service**: FastAPI, LangChain, LangGraph, FAISS, Ollama, Qwen3
- **Database**: PostgreSQL
- **Infrastructure**: Docker, AWS (ECS, ALB, RDS, S3)

## 4. Architecture

### 🏗️ Overall System Architecture

```mermaid
flowchart TD
    U[👤 User] --> F[React Frontend]
    F --> G[API Gateway]
    G --> A[Auth Service<br/>Spring Boot]
    G --> S[Study Service<br/>FastAPI]
    G --> AI[AI Service<br/>FastAPI]
    A --> AUTHDB[(auth_db)]
    S --> STUDYDB[(study_db)]
    AI --> AIDB[(ai_db)]
    AI --> FAISS[(FAISS Vector Index)]
    S --> S3[(Amazon S3)]
```

### 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Auth
    participant Study
    User->>Frontend: Login
    Frontend->>Auth: POST /login
    Auth-->>Frontend: JWT Token
    Frontend->>Study: API Request + JWT
    Study->>Study: Verify JWT Signature
    Study-->>Frontend: Protected Resource
```

### 🤖 Retrieval-Augmented Generation (RAG)

```mermaid
flowchart LR
    PDF[📄 Upload PDF/PPT] --> Extract[Extract Text]
    Extract --> Chunk[Chunking]
    Chunk --> Embed[Sentence Transformer]
    Embed --> FAISS[(FAISS)]
    User[User Question] --> QueryEmbedding[Question Embedding]
    QueryEmbedding --> FAISS
    FAISS --> Context[Top Relevant Chunks]
    Context --> Qwen[Qwen Model]
    Qwen --> Answer[AI Response]
```

### 📚 Learning Workflow

```mermaid
flowchart TD
    Group[Create Study Group]
    Group --> Goal[Set Goal]
    Goal --> Roadmap[Learning Path]
    Roadmap --> Upload[Upload Resources]
    Upload --> AIIndex[AI Indexing]
    AIIndex --> Session[Conduct Study Session]
    Session --> Summary[Generate Summary]
    Summary --> Quiz[Generate Quiz]
    Quiz --> Flashcards[Generate Flashcards]
    Flashcards --> Complete[Mark Topic Complete]
    Complete --> Planner[AI Study Planner]
    Planner --> NextSession[Next Session]
```

### ☁️ AWS Deployment Architecture

```mermaid
flowchart TD
    Internet --> ALB[Application Load Balancer]
    ALB --> FE[ECS - Frontend]
    ALB --> GW[ECS - API Gateway]
    GW --> AUTH[ECS - Auth Service]
    GW --> STUDY[ECS - Study Service]
    GW --> AI[ECS - AI Service]
    AUTH --> RDS[(Amazon RDS)]
    STUDY --> RDS
    AI --> RDS
    STUDY --> S3[(Amazon S3)]
    AI --> S3
    AI --> FAISS[(Vector Store)]
```

### 🔌 Microservices Communication

```mermaid
flowchart LR
    React --> Gateway
    Gateway --> Auth
    Gateway --> Study
    Study --> AI
    AI --> Study
    Study --> Auth
    Study --> PostgreSQL
    AI --> PostgreSQL
    Auth --> PostgreSQL
    Study --> S3
    AI --> FAISS
```

## 5. Folder Structure
- `frontend/` - React frontend application.
- `auth-service/` - Spring Boot authentication service.
- `study-service/` - FastAPI study service.
- `ai-service/` - FastAPI AI service.
- `api-gateway/` - Nginx API Gateway routing.

## 6. Installation
*(To be completed)*

## 7. Local Development
*(To be completed)*

## 8. Environment Variables
*(To be completed)*

## 9. Docker Setup
*(To be completed)*

## 10. Terraform Deployment
*(To be completed)*

## 11. Screenshots
*(To be completed)*

## 12. Future Roadmap
- AI Recommendations for next topics.
- Drag & Drop roadmap reorganization.
- Progress analytics and insights.
- AWS Production Deployment.
