import { motion } from "framer-motion";
import { FileText, Cpu, Database, Brain, Sparkles, MessageSquare, BookOpen, Users } from "lucide-react";

export function RAGFlowSVG() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  // Node uses absolute positioning based on center coordinates
  const Node = ({ icon: Icon, title, subtitle, className = "", cx, cy, width = 144 }: any) => {
    // node height is roughly 100px
    const halfWidth = width / 2;
    const halfHeight = 50; 
    return (
      <motion.div
        variants={itemVariants}
        className={`absolute z-10 flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
        style={{ width: `${width}px`, left: `${cx - halfWidth}px`, top: `${cy - halfHeight}px` }}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${className.includes('bg-') ? 'bg-white/50' : 'bg-gray-50'}`}>
          <Icon className={`w-5 h-5 ${className.includes('text-') ? 'text-inherit' : 'text-gray-700'}`} />
        </div>
        <h3 className="font-semibold text-gray-900 text-xs text-center leading-tight">{title}</h3>
        {subtitle && <p className="text-[10px] text-gray-500 text-center mt-1">{subtitle}</p>}
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 relative overflow-x-auto overflow-y-visible">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="relative mx-auto"
        style={{ width: '1000px', height: '520px' }}
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid meet">
            {/* Horizontal Main Path (Row 1) */}
            <motion.path
              d="M 100 80 L 300 80 L 500 80 L 700 80 L 900 80"
              stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Vertical branching from Qwen (Row 1 to Row 2) */}
            <motion.path
              d="M 900 80 L 900 170 L 200 170 L 200 260 M 900 170 L 400 170 L 400 260 M 900 170 L 600 170 L 600 260 M 900 170 L 800 170 L 800 260"
              stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }} transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
            />
             {/* Branch to Study Group (Row 2 to Row 3) */}
             <motion.path
              d="M 200 260 L 200 370 L 500 370 L 500 450 M 400 260 L 400 370 L 500 370 M 600 260 L 600 370 L 500 370 M 800 260 L 800 370 L 500 370"
              stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }} transition={{ duration: 1.5, delay: 1.5, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Row 1: Centers at Y=80 */}
        <Node icon={FileText} title="Upload Notes" subtitle="PDFs, Docs" cx={100} cy={80} width={144} />
        <Node icon={Cpu} title="Chunking" subtitle="Text Extraction" cx={300} cy={80} width={144} />
        <Node icon={Database} title="Embeddings" subtitle="MiniLM-L6" className="border-indigo-200 bg-indigo-50/20 text-indigo-700 shadow-indigo-100" cx={500} cy={80} width={144} />
        <Node icon={Database} title="FAISS Vector" subtitle="Similarity Search" className="border-indigo-200 bg-indigo-50/20 text-indigo-700 shadow-indigo-100" cx={700} cy={80} width={144} />
        <Node icon={Brain} title="Qwen AI" subtitle="LLM Synthesis" className="border-purple-200 shadow-purple-200 ring-2 ring-purple-100 bg-purple-50/50 text-purple-700" cx={900} cy={80} width={144} />

        {/* Row 2: Centers at Y=260 */}
        <Node icon={FileText} title="Summary" className="border-gray-200 shadow-sm" cx={200} cy={260} width={128} />
        <Node icon={BookOpen} title="Quiz" className="border-gray-200 shadow-sm" cx={400} cy={260} width={128} />
        <Node icon={MessageSquare} title="AI Chat" className="border-gray-200 shadow-sm" cx={600} cy={260} width={128} />
        <Node icon={Sparkles} title="Flashcards" className="border-gray-200 shadow-sm" cx={800} cy={260} width={128} />
        
        {/* Row 3: Center at Y=450 */}
        <motion.div
          variants={itemVariants}
          className="absolute z-10 flex flex-col items-center justify-center p-6 border-2 border-emerald-200 shadow-emerald-100/50 ring-4 ring-emerald-50 bg-emerald-50 text-emerald-800 rounded-2xl w-72"
          style={{ left: `${500 - 144}px`, top: `${450 - 60}px` }}
        >
          <Users className="w-8 h-8 mb-3" />
          <h3 className="font-bold text-sm">Collaborative Study Group</h3>
          <p className="text-xs mt-1 text-emerald-600/80 font-medium">Real-time syncing & learning</p>
        </motion.div>
        
      </motion.div>
    </div>
  );
}
