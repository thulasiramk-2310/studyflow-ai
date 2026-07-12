import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles, Calendar, Zap, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white overflow-hidden font-sans selection:bg-primary selection:text-white">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">StudyFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Go to Dashboard
                <LayoutDashboard className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="h-9 px-4 inline-flex items-center justify-center rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="pt-32 pb-20 relative">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] pointer-events-none opacity-50">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[sfFade_8s_ease-in-out_infinite_alternate]" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[sfFade_8s_ease-in-out_infinite_alternate_2s]" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[sfFade_8s_ease-in-out_infinite_alternate_4s]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft border border-primary/10 text-primary text-sm font-semibold mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>The future of collaborative learning</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight"
          >
            Study together. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              Learn faster with AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Create study groups, share your materials, run live sessions, and get instant answers grounded in your own documents — every response cites the exact page.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="h-12 px-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-white text-base font-semibold hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              Get started free
              <ArrowRight className="w-5 h-5" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="h-12 px-8 inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-900 text-base font-semibold hover:bg-gray-200 transition-colors"
              >
                Log in
              </Link>
            )}
          </motion.div>
        </div>
      </main>

      {/* ── Features Section ── */}
      <section className="py-24 bg-gray-50/50 border-t border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything your study group needs</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Powerful tools designed to keep you organized, focused, and learning efficiently.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Sparkles className="w-6 h-6 text-primary" />,
                bg: "bg-primary-soft",
                title: "AI grounded in files",
                description: "Ask anything, get answers cited directly from your group's PDFs and slides."
              },
              {
                icon: <Users className="w-6 h-6 text-emerald-600" />,
                bg: "bg-emerald-50",
                title: "Collaborative groups",
                description: "Spin up a study group in seconds. Invite peers and learn together."
              },
              {
                icon: <Calendar className="w-6 h-6 text-secondary" />,
                bg: "bg-secondary-soft",
                title: "Sessions & quizzes",
                description: "Schedule sessions and auto-generate quizzes from your study material."
              },
              {
                icon: <Zap className="w-6 h-6 text-amber-600" />,
                bg: "bg-amber-50",
                title: "Track progress",
                description: "See your mastery improve over time with detailed analytics and insights."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-gray-100 bg-white text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center text-white font-bold text-xs">
            S
          </div>
          <span className="font-semibold text-gray-900">StudyFlow AI</span>
        </div>
        <p className="text-sm text-gray-400">© 2026 StudyFlow AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
