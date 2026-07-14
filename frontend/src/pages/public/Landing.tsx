import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageSquare, BookOpen, Calendar, Users, Bell, Brain, Settings, CheckCircle2, Cloud, FileText, LayoutDashboard, ShieldCheck, Database, Server, Cpu, Lock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { RAGFlowSVG } from "../../components/landing/RAGFlowSVG";
import { ArchitectureSVG } from "../../components/landing/ArchitectureSVG";

export function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-white overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/20">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">StudyFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-8 bg-gray-100 animate-pulse rounded-md" />
                <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-full" />
              </div>
            ) : isAuthenticated ? (
              <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
                <Link to="/register" className="h-9 px-4 inline-flex items-center justify-center rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="pt-32 pb-24 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] pointer-events-none opacity-40">
          <div className="absolute top-10 left-10 w-96 h-96 bg-rose-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-[sfFade_8s_ease-in-out_infinite_alternate]" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-[sfFade_8s_ease-in-out_infinite_alternate_2s]" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-[sfFade_8s_ease-in-out_infinite_alternate_4s]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-2xl text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold mb-6">
                  <Sparkles className="w-4 h-4" />
                  Study Smarter, Together
                </span>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                  The AI Workspace for <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600">
                    Collaborative Learning
                  </span>
                </h1>
                <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                  Create collaborative study spaces where AI transforms your documents into summaries, quizzes, flashcards, and intelligent study plans—grounded entirely in your own notes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Link to="/register" className="h-12 px-8 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="#architecture" className="h-12 px-8 inline-flex items-center justify-center rounded-full bg-white text-gray-700 font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
                    View Architecture
                  </a>
                </div>
                
                {/* Hero Badges */}
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"><Cloud className="w-4 h-4 text-blue-500"/> AWS Deployed</div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"><Server className="w-4 h-4 text-blue-600"/> Dockerized</div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"><Brain className="w-4 h-4 text-purple-500"/> RAG Powered</div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Secure by Design</div>
                </div>
              </motion.div>
            </div>

            {/* Right Realistic Product Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-white rounded-2xl transform rotate-3 scale-105 border border-gray-200/50 shadow-xl" />
              <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex h-[480px]">
                {/* Sidebar */}
                <div className="w-48 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-8 text-gray-900 font-bold">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center text-xs">S</div>
                    StudyFlow
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-200/50 text-gray-900 text-sm font-medium">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </div>
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-500 text-sm font-medium">
                      <MessageSquare className="w-4 h-4" /> AI Chat
                    </div>
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-500 text-sm font-medium">
                      <FileText className="w-4 h-4" /> Flashcards
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200" /> User
                    </div>
                  </div>
                </div>
                {/* Main Content Area */}
                <div className="flex-1 bg-white flex flex-col p-6 overflow-hidden">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Advanced Machine Learning Group</h2>
                  
                  {/* Top Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                      <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Upcoming Session</div>
                      <div className="text-gray-900 font-bold">Today, 4:00 PM</div>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                      <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Members</div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white"/>
                          <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white"/>
                          <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white"/>
                        </div>
                        <span className="text-sm font-bold text-gray-900">+4</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock AI Chat Interface */}
                  <div className="flex-1 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col overflow-hidden relative">
                    <div className="p-3 border-b border-gray-200 bg-white flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-bold text-gray-700">StudyFlow AI</span>
                    </div>
                    <div className="p-4 space-y-4">
                       <div className="flex gap-3">
                         <div className="w-6 h-6 rounded-full bg-rose-100 flex-shrink-0" />
                         <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 max-w-[80%]">
                           Can you explain the self-attention mechanism?
                         </div>
                       </div>
                       <div className="flex gap-3">
                         <div className="w-6 h-6 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center"><Brain className="w-3 h-3 text-purple-600"/></div>
                         <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm text-sm text-gray-800 max-w-[90%]">
                           <p className="mb-2"><strong>Self-Attention Mechanism:</strong></p>
                           <p className="text-xs text-gray-600">Self-attention allows the model to weigh the importance of different words in a sequence regardless of their positional distance... <span className="text-purple-600 font-mono bg-purple-50 px-1 rounded">[pg. 42]</span></p>
                         </div>
                       </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 bg-white border border-gray-200 rounded-full h-10 px-4 flex items-center">
                       <span className="text-gray-400 text-sm">Ask a question based on notes...</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>


      {/* ── How it Works (RAG Flow) ── */}
      <section className="py-24 bg-gray-50 border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How StudyFlow AI Works</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-12">Upload once. Learn smarter together with an end-to-end Retrieval-Augmented Generation pipeline.</p>
          <div className="overflow-x-auto pb-8 hide-scrollbar">
            <RAGFlowSVG />
          </div>
        </div>
      </section>

      {/* ── Core Features Grid ── */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: "AI Chat (RAG)", desc: "Ask questions and get answers grounded entirely in your uploaded group documents, complete with citations.", color: "text-purple-600", bg: "bg-purple-50", border: "hover:border-purple-200" },
              { icon: BookOpen, title: "Quiz Generator", desc: "Automatically generate multiple-choice, short-answer, and true/false quizzes to test your group's knowledge.", color: "text-emerald-600", bg: "bg-emerald-50", border: "hover:border-emerald-200" },
              { icon: Sparkles, title: "Flashcards", desc: "Turn dense PDFs into spaced-repetition flashcard decks with a single click. Master concepts faster.", color: "text-amber-600", bg: "bg-amber-50", border: "hover:border-amber-200" },
              { icon: Calendar, title: "AI Study Planner", desc: "Let AI analyze your group's progress and automatically schedule the next optimal study session.", color: "text-indigo-600", bg: "bg-indigo-50", border: "hover:border-indigo-200" },
              { icon: Users, title: "Collaborative Sessions", desc: "Join live sessions with your peers. Discuss materials, take quizzes together, and track attendance.", color: "text-blue-600", bg: "bg-blue-50", border: "hover:border-blue-200" },
              { icon: Bell, title: "Smart Notifications", desc: "Never miss an upload or an upcoming session. Get real-time alerts when your study group is active.", color: "text-rose-600", bg: "bg-rose-50", border: "hover:border-rose-200" }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${f.border} group`}
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Engineering Highlights ── */}
      <section className="py-24 bg-gray-900 text-white relative">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Engineering Highlights</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Designed for scale. Built with production-grade enterprise patterns.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[
               "Microservices Architecture",
               "Database-per-Service",
               "JWT Authentication",
               "Role-Based Access Control",
               "Persistent AI Chat",
               "Retrieval-Augmented Generation",
               "Storage Abstraction",
               "AWS Cloud Ready",
               "Infrastructure as Code (Terraform)"
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-3 bg-gray-800 border border-gray-700 p-4 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-200">{item}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ── Architecture Diagram ── */}
      <section id="architecture" className="py-24 bg-white border-b border-gray-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-bold mb-6 uppercase tracking-wider">
            System Topology
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powered by <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
               Retrieval-Augmented Generation & Microservices
            </span>
          </h2>
          <p className="text-gray-500 max-w-3xl mx-auto mb-16 text-lg">
             A robust, scalable backend architecture ensuring high availability, secure internal communication, and seamless AI integration.
          </p>
          <ArchitectureSVG />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gray-900 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-indigo-500/20" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Ready to transform collaborative learning?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link to="/register" className="h-12 px-8 inline-flex items-center justify-center rounded-full bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors">
                Create Account
              </Link>
              <Link to="/login" className="h-12 px-8 inline-flex items-center justify-center rounded-full bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Professional Footer ── */}
      <footer className="pt-16 pb-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2">
                 <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold">
                     S
                  </div>
                  <span className="font-bold text-gray-900 text-lg">StudyFlow AI</span>
                 </div>
                 <p className="text-gray-500 text-sm max-w-xs mb-6">
                    The advanced AI workspace built for students, universities, and engineering teams to learn collaboratively.
                 </p>
                 <div className="flex gap-4">
                    {/* Social icons placeholder */}
                    <div className="w-8 h-8 rounded-full bg-gray-100" />
                    <div className="w-8 h-8 rounded-full bg-gray-100" />
                 </div>
              </div>
              
              <div>
                 <h4 className="font-bold text-gray-900 mb-4">Product</h4>
                 <ul className="space-y-2 text-sm text-gray-500">
                    <li><Link to="/register" className="hover:text-gray-900">Sign Up</Link></li>
                    <li><Link to="/login" className="hover:text-gray-900">Login</Link></li>
                    <li><a href="#features" className="hover:text-gray-900">Features</a></li>
                 </ul>
              </div>
              
              <div>
                 <h4 className="font-bold text-gray-900 mb-4">Engineering</h4>
                 <ul className="space-y-2 text-sm text-gray-500">
                    <li><a href="#architecture" className="hover:text-gray-900">Architecture</a></li>
                    <li><a href="#" className="hover:text-gray-900">Documentation</a></li>
                    <li><a href="#" className="hover:text-gray-900">GitHub Source</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
                 <ul className="space-y-2 text-sm text-gray-500">
                    <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-gray-900">Terms of Service</a></li>
                 </ul>
              </div>
           </div>

           <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">© 2026 StudyFlow AI. Designed for production scale.</p>
              <div className="flex gap-2 items-center text-sm font-mono text-gray-400">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
