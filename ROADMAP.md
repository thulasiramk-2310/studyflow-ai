# StudyFlow AI Roadmap

✅ Phase 1 - Foundation
✅ Authentication
✅ Groups
✅ Resources
✅ Sessions
✅ AI Ingestion
✅ Retrieval
✅ Chat

🟨 AI Summaries
⬜ Quiz Generator
⬜ Flashcards
⬜ Study Planner
⬜ Analytics
⬜ AWS Deployment
⬜ CI/CD
⬜ v1 Release

## Follow-ups (not urgent)

⬜ Retune chunk size — CHUNK_SIZE=1000 yields only 7 chunks over a 4-page PDF, diluting single-topic queries below the 0.45 relevance gate (see MIN_RELEVANCE in app/agents/nodes.py). ~400 should widen the gap. Requires re-indexing existing groups.
⬜ Add a pytest job to CI — .github/workflows/backend.yml currently runs docker build only.
⬜ Remove dead code — app/services/rag.py::generate_rag_response has had no callers since /chat moved to the agent graph.
⬜ Rebuild the ai-service docker image — unbuilt since langchain-text-splitters was bumped 0.2.1 to 1.1.2 for langgraph.
