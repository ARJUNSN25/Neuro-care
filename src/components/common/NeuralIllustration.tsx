import { motion } from 'framer-motion'
import { Activity, Brain, Moon, ShieldCheck, Sparkles } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

export function NeuralIllustration() {
  const t = useTranslation()

  return (
    <div className="relative mx-auto w-full max-w-[520px] select-none">
      {/* Ambient Vintage Sage & Copper Aura */}
      <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-[#2E6F73]/25 via-[#7FB388]/15 to-[#C6601F]/15 blur-3xl pointer-events-none" />

      <div className="relative overflow-hidden rounded-3xl border-2 border-[#2E6F73]/50 bg-gradient-to-br from-[#0A0F14] via-[#0F3D3E] to-[#174A4C] p-6 sm:p-8 text-[#EADCC8] shadow-2xl shadow-[#0A0F14]/50">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[#EADCC8]/15 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7FB388]" />
            <span className="text-xs font-medium text-[#EADCC8]/90">
              {t.illustration.headerTitle}
            </span>
          </div>
          <span className="rounded-full bg-[#C6601F]/20 border border-[#C6601F]/50 px-2.5 py-0.5 text-[10px] font-semibold text-[#EADCC8]">
            {t.illustration.samplePill}
          </span>
        </div>

        {/* Central Animated Neural Constellation */}
        <div className="relative my-6 flex h-56 items-center justify-center">
          <svg
            viewBox="0 0 360 220"
            className="h-full w-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Orbital Rings */}
            <motion.circle
              cx="180"
              cy="110"
              r="86"
              stroke="rgba(234, 220, 200, 0.24)"
              strokeDasharray="6 6"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              style={{ originX: '180px', originY: '110px' }}
            />
            <motion.circle
              cx="180"
              cy="110"
              r="62"
              stroke="rgba(127, 179, 136, 0.42)"
              strokeWidth="1.5"
              animate={{ rotate: -360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
              style={{ originX: '180px', originY: '110px' }}
            />

            {/* Connecting Synaptic Lines */}
            <g stroke="url(#synapseGrad)" strokeWidth="1.5" strokeOpacity="0.85">
              <line x1="180" y1="110" x2="88" y2="56" />
              <line x1="180" y1="110" x2="275" y2="54" />
              <line x1="180" y1="110" x2="78" y2="162" />
              <line x1="180" y1="110" x2="280" y2="164" />
              <line x1="88" y1="56" x2="275" y2="54" strokeOpacity="0.35" />
              <line x1="78" y1="162" x2="280" y2="164" strokeOpacity="0.35" />
            </g>

            {/* Stylized Brain Silhouette */}
            <path
              d="M180 62C155.5 62 136 80.5 136 103.5C136 116.5 142.2 128 152 135.5V148C152 154 157 159 163 159H197C203 159 208 154 208 148V135.5C217.8 128 224 116.5 224 103.5C224 80.5 204.5 62 180 62Z"
              fill="rgba(46, 111, 115, 0.45)"
              stroke="#EADCC8"
              strokeWidth="2.2"
            />
            <path
              d="M164 96C169 90 175 90 180 96C185 90 191 90 196 96"
              stroke="#7FB388"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M158 115C168 122 192 122 202 115"
              stroke="#EADCC8"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Pulsing Nodes */}
            {[
              { cx: 88, cy: 56, color: '#7FB388', delay: 0 },
              { cx: 275, cy: 54, color: '#EADCC8', delay: 0.4 },
              { cx: 78, cy: 162, color: '#C6601F', delay: 0.8 },
              { cx: 280, cy: 164, color: '#7FB388', delay: 1.2 },
            ].map((node, i) => (
              <g key={i}>
                <motion.circle
                  cx={node.cx}
                  cy={node.cy}
                  r="11"
                  fill={node.color}
                  fillOpacity="0.22"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.75, 0.35] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    delay: node.delay,
                  }}
                />
                <circle cx={node.cx} cy={node.cy} r="5.5" fill={node.color} />
              </g>
            ))}

            <defs>
              <linearGradient id="synapseGrad" x1="0" y1="0" x2="360" y2="220">
                <stop offset="0%" stopColor="#7FB388" />
                <stop offset="50%" stopColor="#EADCC8" />
                <stop offset="100%" stopColor="#C6601F" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating Metric Chips */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
            className="absolute start-0 top-2 rounded-xl border border-[#EADCC8]/20 bg-[#0A0F14]/80 px-3 py-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-[#7FB388] font-semibold">
              <Brain className="h-3.5 w-3.5" /> {t.illustration.taskPerfLabel}
            </div>
            <div className="text-xs font-bold text-[#EADCC8] tabular-nums mt-0.5">
              {t.illustration.taskPerfVal}
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute end-0 top-2 rounded-xl border border-[#EADCC8]/20 bg-[#0A0F14]/80 px-3 py-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-[#EADCC8] font-semibold">
              <Moon className="h-3.5 w-3.5 text-[#7FB388]" /> {t.illustration.sleepMeasuredLabel}
            </div>
            <div className="text-xs font-bold text-[#EADCC8] tabular-nums mt-0.5">
              {t.illustration.sleepMeasuredVal}
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 3.8, repeat: Infinity }}
            className="absolute start-0 bottom-0 rounded-xl border border-[#EADCC8]/20 bg-[#0A0F14]/80 px-3 py-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-[#7FB388] font-semibold">
              <Activity className="h-3.5 w-3.5" /> {t.illustration.dailyActivityLabel}
            </div>
            <div className="text-xs font-bold text-[#EADCC8] tabular-nums mt-0.5">
              {t.illustration.dailyActivityVal}
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4.2, repeat: Infinity }}
            className="absolute end-0 bottom-0 rounded-xl border border-[#C6601F]/40 bg-[#0A0F14]/80 px-3 py-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-[#EADCC8] font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-[#C6601F]" /> {t.illustration.selfReportLabel}
            </div>
            <div className="text-xs font-bold text-[#EADCC8] tabular-nums mt-0.5">
              {t.illustration.selfReportVal}
            </div>
          </motion.div>
        </div>

        {/* Bottom Trust Note */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[#0A0F14]/65 px-3.5 py-2.5 text-[11px] text-[#EADCC8]/90 border border-[#7FB388]/25">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#7FB388] shrink-0" />
            <span>{t.illustration.trustNote}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
