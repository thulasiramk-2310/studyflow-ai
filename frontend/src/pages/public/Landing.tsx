import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageSquare, BookOpen, Calendar, Users, Bell, Brain, Settings, CheckCircle2, Cloud, FileText, LayoutDashboard, ShieldCheck, Database, Server, Cpu, Lock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { RAGFlowSVG } from "../../components/landing/RAGFlowSVG";
import { ArchitectureSVG } from "../../components/landing/ArchitectureSVG";

export function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/20">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">StudyFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md" />
                <div className="w-24 h-9 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
              </div>
            ) : isAuthenticated ? (
              <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Log in</Link>
                <Link to="/register" className="h-9 px-4 inline-flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="pt-32 pb-24 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] pointer-events-none opacity-40 dark:opacity-50">
          <div className="absolute top-10 left-10 w-96 h-96 bg-rose-400 dark:bg-rose-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 animate-[sfFade_8s_ease-in-out_infinite_alternate]" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-400 dark:bg-indigo-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 animate-[sfFade_8s_ease-in-out_infinite_alternate_2s]" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-400 dark:bg-purple-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 animate-[sfFade_8s_ease-in-out_infinite_alternate_4s]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-2xl text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold mb-6">
                  <Sparkles className="w-4 h-4" />
                  Study Smarter, Together
                </span>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.1]">
                  The AI Workspace for <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600 dark:from-rose-400 dark:to-indigo-400">
                    Collaborative Learning
                  </span>
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                  Create collaborative study spaces where AI transforms your documents into summaries, quizzes, flashcards, and intelligent study plans—grounded entirely in your own notes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Link to="/register" className="h-12 px-8 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>


              </motion.div>
            </div>

            {/* Right Realistic Product Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl transform rotate-3 scale-105 border border-gray-200/50 dark:border-gray-700/50 shadow-xl" />
              <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex h-[480px]">
                {/* Sidebar */}
                <div className="w-48 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-8 text-gray-900 dark:text-white font-bold">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center text-xs">S</div>
                    StudyFlow
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-200/50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </div>
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 text-sm font-medium">
                      <MessageSquare className="w-4 h-4" /> AI Chat
                    </div>
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 text-sm font-medium">
                      <FileText className="w-4 h-4" /> Flashcards
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30" /> User
                    </div>
                  </div>
                </div>
                {/* Main Content Area */}
                <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col p-6 overflow-hidden">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Advanced Machine Learning Group</h2>

                  {/* Top Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 shadow-sm">
                      <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase mb-1">Upcoming Session</div>
                      <div className="text-gray-900 dark:text-white font-bold">Today, 4:00 PM</div>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 shadow-sm">
                      <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase mb-1">Members</div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/30 border-2 border-white dark:border-gray-900"/>
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/30 border-2 border-white dark:border-gray-900"/>
                          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/30 border-2 border-white dark:border-gray-900"/>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">+4</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock AI Chat Interface */}
                  <div className="flex-1 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950/50 flex flex-col overflow-hidden relative">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">StudyFlow AI</span>
                    </div>
                    <div className="p-4 space-y-4">
                       <div className="flex gap-3">
                         <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-500/20 flex-shrink-0" />
                         <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-sm text-gray-600 dark:text-gray-300 max-w-[80%]">
                           Can you explain the self-attention mechanism?
                         </div>
                       </div>
                       <div className="flex gap-3">
                         <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 flex-shrink-0 flex items-center justify-center"><Brain className="w-3 h-3 text-purple-600 dark:text-purple-400"/></div>
                         <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-100 dark:border-purple-500/30 shadow-sm text-sm text-gray-800 dark:text-gray-200 max-w-[90%]">
                           <p className="mb-2"><strong>Self-Attention Mechanism:</strong></p>
                           <p className="text-xs text-gray-600 dark:text-gray-400">Self-attention allows the model to weigh the importance of different words in a sequence regardless of their positional distance... <span className="text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-500/10 px-1 rounded">[pg. 42]</span></p>
                         </div>
                       </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full h-10 px-4 flex items-center">
                       <span className="text-gray-400 dark:text-gray-500 text-sm">Ask a question based on notes...</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>



      {/* ── Core Features Grid ── */}
      <section id="features" className="py-24 bg-white dark:bg-gray-950 relative border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to learn smarter</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">Upload your materials once. StudyFlow AI handles the rest.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: "AI Chat (RAG)", desc: "Ask questions and get answers grounded entirely in your uploaded group documents, complete with citations.", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "hover:border-purple-200 dark:hover:border-purple-500/40" },
              { icon: BookOpen, title: "Quiz Generator", desc: "Automatically generate multiple-choice, short-answer, and true/false quizzes to test your group's knowledge.", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "hover:border-emerald-200 dark:hover:border-emerald-500/40" },
              { icon: Sparkles, title: "Flashcards", desc: "Turn dense PDFs into spaced-repetition flashcard decks with a single click. Master concepts faster.", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "hover:border-amber-200 dark:hover:border-amber-500/40" },
              { icon: Calendar, title: "AI Study Planner", desc: "Let AI analyze your group's progress and automatically schedule the next optimal study session.", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "hover:border-indigo-200 dark:hover:border-indigo-500/40" },
              { icon: Users, title: "Collaborative Sessions", desc: "Join live sessions with your peers. Discuss materials, take quizzes together, and track attendance.", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "hover:border-blue-200 dark:hover:border-blue-500/40" },
              { icon: Bell, title: "Smart Notifications", desc: "Never miss an upload or an upcoming session. Get real-time alerts when your study group is active.", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", border: "hover:border-rose-200 dark:hover:border-rose-500/40" }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg dark:hover:shadow-black/40 transition-all duration-300 hover:-translate-y-1 ${f.border} group`}
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* ── Final CTA ── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gray-900 dark:bg-gray-900 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden border border-transparent dark:border-gray-800">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-indigo-500/20" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Ready to transform collaborative learning?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link to="/register" className="h-12 px-8 inline-flex items-center justify-center rounded-full bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors">
                Create Account
              </Link>
              <Link to="/login" className="h-12 px-8 inline-flex items-center justify-center rounded-full bg-gray-800 dark:bg-gray-700 text-white font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Professional Footer ── */}
      <footer className="pt-16 pb-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2">
                 <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 font-bold">
                     S
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">StudyFlow AI</span>
                 </div>
                 <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
                    The advanced AI workspace built for students, universities, and engineering teams to learn collaboratively.
                 </p>
                 <div className="flex gap-4">
                    {/* Social icons placeholder */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
                 </div>
              </div>

              <div>
                 <h4 className="font-bold text-gray-900 dark:text-white mb-4">Product</h4>
                 <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <li><Link to="/register" className="hover:text-gray-900 dark:hover:text-white">Sign Up</Link></li>
                    <li><Link to="/login" className="hover:text-gray-900 dark:hover:text-white">Login</Link></li>
                    <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="font-bold text-gray-900 dark:text-white mb-4">Engineering</h4>
                 <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <li><a href="#architecture" className="hover:text-gray-900 dark:hover:text-white">Architecture</a></li>
                    <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Documentation</a></li>
                    <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">GitHub Source</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
                 <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</a></li>
                 </ul>
              </div>
           </div>

           <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 dark:text-gray-500">© 2026 StudyFlow AI. Designed for production scale.</p>
              <div className="flex gap-2 items-center text-sm font-mono text-gray-400 dark:text-gray-500">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
