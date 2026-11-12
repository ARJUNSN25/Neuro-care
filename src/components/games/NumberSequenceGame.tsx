import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Hash, Play, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTranslation } from '@/hooks/useTranslation'
import type { GameResult } from '@/types/neurocare'

function randomDigits(len: number): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += Math.floor(Math.random() * 10).toString()
  }
  return out
}

export function NumberSequenceGame({
  onComplete,
}: {
  onComplete: (result: Omit<GameResult, 'id'>) => void
}) {
  const t = useTranslation()
  const cat = t.gamesPage.catalog['number-sequence']
  const g = t.gamesPage.numberSeq
  const c = t.gamesPage.common

  const [phase, setPhase] = useState<'instructions' | 'show' | 'input' | 'result'>(
    'instructions'
  )
  const [level, setLevel] = useState(1)
  const [sequence, setSequence] = useState('')
  const [userInput, setUserInput] = useState('')
  const [maxSpan, setMaxSpan] = useState(0)
  const [correctRounds, setCorrectRounds] = useState(0)
  const [lastFeedback, setLastFeedback] = useState('')
  const startTimeRef = useRef<number>(0)

  const startRound = (nextLevel: number) => {
    const length = nextLevel + 2 // Level 1 = 3 digits...
    const seq = randomDigits(length)
    setSequence(seq)
    setUserInput('')
    setPhase('show')
  }

  const startGame = () => {
    startTimeRef.current = Date.now()
    setLevel(1)
    setMaxSpan(0)
    setCorrectRounds(0)
    setLastFeedback('')
    startRound(1)
  }

  useEffect(() => {
    if (phase !== 'show') return
    const displayMs = Math.min(4500, 1400 + sequence.length * 380)
    const id = setTimeout(() => setPhase('input'), displayMs)
    return () => clearTimeout(id)
  }, [phase, sequence])

  const finishGame = (finalSpan: number, roundsCleared: number, totalAttempts: number) => {
    const duration = Math.max(8, Math.round((Date.now() - startTimeRef.current) / 1000))
    const acc = Math.round((roundsCleared / Math.max(1, totalAttempts)) * 100)
    const score = Math.min(100, Math.round(finalSpan * 11 + acc * 0.2))
    onComplete({
      gameType: 'number-sequence',
      gameName: cat.title,
      date: new Date().toISOString().slice(0, 10),
      completedAt: new Date().toISOString(),
      score,
      metricLabel: cat.metricLabel,
      metricValue: `${finalSpan} ${t.units.digits}`,
      accuracyPct: acc,
      durationSeconds: duration,
      levelReached: Math.max(1, roundsCleared),
    })
    setPhase('result')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userInput.trim() === sequence) {
      const nextSpan = sequence.length
      const nextCorrect = correctRounds + 1
      setMaxSpan(nextSpan)
      setCorrectRounds(nextCorrect)
      setLastFeedback(g.correctFeedback)
      if (level >= 6) {
        finishGame(nextSpan, nextCorrect, level)
      } else {
        const nextLvl = level + 1
        setLevel(nextLvl)
        startRound(nextLvl)
      }
    } else {
      setLastFeedback(`${g.wrongFeedback} (${sequence})`)
      finishGame(maxSpan || sequence.length - 1, correctRounds, level)
    }
  }

  return (
    <div className="space-y-5">
      {phase === 'instructions' && (
        <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E6F73]/18 text-[#0F3D3E]">
              <Hash className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-[#0F3D3E]">{cat.title}</h3>
              <p className="text-xs text-[#4A5D5E]">{g.desc}</p>
            </div>
          </div>
          <ul className="text-sm text-[#263A3B] space-y-1.5 list-disc ps-5">
            {g.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <Button variant="primary" size="lg" onClick={startGame}>
            <Play className="h-4 w-4" />
            {g.startBtn}
          </Button>
        </div>
      )}

      {phase === 'show' && (
        <div className="rounded-2xl border border-[#2E6F73]/30 bg-[#0A0F14] p-10 text-center text-[#EADCC8] space-y-3">
          <Badge variant="cyan">
            {g.levelBadge
              .replace('{level}', String(level))
              .replace('{len}', String(sequence.length))}
          </Badge>
          <motion.div
            key={sequence}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            dir="ltr"
            className="text-4xl sm:text-5xl font-extrabold tracking-[0.28em] tabular-nums py-4"
          >
            {sequence}
          </motion.div>
          <p className="text-xs text-[#D8CEBE]">{g.memorizeHint}</p>
        </div>
      )}

      {phase === 'input' && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#2E6F73]/25 bg-[#F7EFE3] p-6 space-y-4 max-w-md mx-auto text-center"
        >
          <Badge variant="primary">
            {g.recallBadge.replace('{len}', String(sequence.length))}
          </Badge>
          {lastFeedback && (
            <p className="text-xs font-medium text-[#0F3D3E]">{lastFeedback}</p>
          )}
          <Input
            autoFocus
            inputMode="numeric"
            dir="ltr"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
            placeholder={g.placeholder}
            className="text-center text-2xl font-bold tracking-[0.22em] h-14"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {g.submitBtn}
          </Button>
        </form>
      )}

      {phase === 'result' && (
        <div className="rounded-2xl border border-[#7FB388]/55 bg-[#7FB388]/18 p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-[#0F3D3E] font-bold">
            <CheckCircle2 className="h-5 w-5" />
            <span>
              {cat.title} — {c.savedBanner}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20">
              <p className="text-[11px] text-[#4A5D5E]">{g.maxDigitSpan}</p>
              <p className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                {maxSpan} {t.units.digits}
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20">
              <p className="text-[11px] text-[#4A5D5E]">{g.roundsCleared}</p>
              <p className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                {correctRounds}
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20">
              <p className="text-[11px] text-[#4A5D5E]">{g.gameScore}</p>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {Math.min(100, Math.round(maxSpan * 11 + (correctRounds / Math.max(1, level)) * 20))}
              </p>
            </div>
          </div>
          {lastFeedback && (
            <p className="text-xs text-[#263A3B]">{lastFeedback}</p>
          )}
          <Button variant="primary" onClick={startGame}>
            <RotateCcw className="h-4 w-4" />
            {c.playAgain}
          </Button>
        </div>
      )}
    </div>
  )
}
