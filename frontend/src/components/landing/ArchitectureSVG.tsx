import { motion } from "framer-motion";
import { Server, Database, Layout, Cpu, RefreshCw, ShieldCheck } from "lucide-react";

export function ArchitectureSVG() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const Node = ({ icon: Icon, title, subtitle, className = "" }: any) => (
    <motion.div
      variants={itemVariants}
      className={`relative z-10 flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm w-64 ${className}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${className.includes('bg-') ? 'bg-white/50' : 'bg-gray-50'}`}>
        <Icon className={`w-5 h-5 ${className.includes('text-') ? 'text-inherit' : 'text-gray-700'}`} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{subtitle}</p>}
      </div>
    </motion.div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto py-12 relative flex flex-col items-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="flex flex-col items-center relative gap-8 w-full max-w-[672px]"
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg className="w-full h-full" style={{ overflow: "visible" }}>
            {/* Main vertical pipeline */}
            <motion.path
              d="M 336 70 L 336 120 M 336 190 L 336 240 M 336 310 L 336 360 M 336 430 L 336 480 M 336 550 L 336 600"
              stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Return path (curved) */}
            <motion.path
              d="M 336 600 C 50 600, 50 70, 336 70"
              stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              viewport={{ once: true }} transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
            />
            
            {/* Animated data packets (Glowing dots) */}
            <motion.circle
              r="4" fill="#06b6d4"
              initial={{ offsetDistance: "0%" } as any}
              animate={{ offsetDistance: "100%" } as any}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ offsetPath: "path('M 336 70 L 336 120 L 336 190 L 336 240 L 336 310 L 336 360 L 336 430 L 336 480 L 336 550 L 336 600')" } as any}
              className="shadow-[0_0_12px_#06b6d4]"
            />
            <motion.circle
              r="4" fill="#10b981"
              initial={{ offsetDistance: "0%" } as any}
              animate={{ offsetDistance: "100%" } as any}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2 }}
              style={{ offsetPath: "path('M 336 600 C 50 600, 50 70, 336 70')" } as any}
              className="shadow-[0_0_12px_#10b981]"
            />
          </svg>
        </div>

        <Node icon={Layout} title="React Frontend" subtitle="Client" className="border-cyan-200 bg-cyan-50/50 text-cyan-700" />
        
        <Node icon={Server} title="API Gateway" subtitle="Nginx / Routing" className="border-gray-300 shadow-md" />

        <Node icon={ShieldCheck} title="Study Service" subtitle="Spring Boot + PostgreSQL" className="border-blue-200 bg-blue-50/50 text-blue-700" />
        
        <Node icon={Cpu} title="AI Service" subtitle="FastAPI + Groq" className="border-purple-200 bg-purple-50/50 text-purple-700" />

        <Node icon={Database} title="FAISS Vector DB" subtitle="Similarity Retrieval" className="border-rose-200 bg-rose-50/50 text-rose-700" />

        <Node icon={RefreshCw} title="Generated Response" subtitle="Data Returned to Client" className="border-emerald-200 bg-emerald-50/50 text-emerald-700" />
      </motion.div>
    </div>
  );
}
