import { jsPDF } from 'jspdf'
import { getLocalizedRec, TRANSLATIONS } from '@/data/translations'
import {
  computeBrainHealthReport,
  formatAssessmentCategorySummary,
} from '@/services/neurocareAI'
import type { LanguageCode, NeuroCareState } from '@/types/neurocare'

interface ReportPdfSections {
  lang: LanguageCode
  dir: 'ltr' | 'rtl'
  bannerTitle: string
  bannerSub: string
  metaLine: string
  disclaimerHeading: string
  disclaimerText: string
  sections: {
    title: string
    badge?: string
    paragraphs: string[]
  }[]
  fileName: string
}

function buildLocalizedPdfData(state: NeuroCareState): ReportPdfSections {
  const lang = state.user.preferredLanguage ?? 'en'
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.en
  const report = computeBrainHealthReport(state)
  const pdfL = t.reportPage.pdfLabels

  const sortedAssessments = [...state.assessments].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt)
  )
  const latest = sortedAssessments[0]

  const naLabel = t.statusLabels['Insufficient information']
  const taskPctText =
    report.latestTaskPct !== null ? `${report.latestTaskPct}%` : naLabel
  const funcPctText =
    report.latestFunctionalPct !== null ? `${report.latestFunctionalPct}%` : naLabel

  const conditionsText = state.user.medicalConditions.length
    ? state.user.medicalConditions.join(', ')
    : t.reportPage.noneListed

  const famText = state.familyHistory.length
    ? state.familyHistory
        .map((f) => {
          const cond = t.familyConditionNames[f.condition] ?? f.condition
          const rel = t.familyRelativeCommon[f.relative] ?? f.relative
          return `${cond} (${rel}${
            f.approximateAgeOfOnset
              ? `, ${t.reportPage.onsetPrefix} ${f.approximateAgeOfOnset}`
              : ''
          })`
        })
        .join(' · ')
    : t.reportPage.noFamilyIncluded

  const topRecs = state.recommendations.slice(0, 4).map((rec) => {
    const loc = getLocalizedRec(rec, t)
    const cat = t.recCategories[rec.category] ?? rec.category
    const st = rec.completed ? t.completed : t.pending
    return `• [${cat}] ${loc.title} (${st}): ${loc.description}`
  })

  return {
    lang,
    dir: t.dir,
    bannerTitle: pdfL.bannerTitle,
    bannerSub: pdfL.bannerSub,
    metaLine: `${t.reportPage.preparedFor}: ${state.user.fullName} (${state.user.ageRange})  |  ${t.reportPage.generatedAt}: ${report.generatedAt}`,
    disclaimerHeading: pdfL.disclaimerHeading,
    disclaimerText: pdfL.disclaimerText,
    sections: [
      {
        title: pdfL.sec1,
        badge: t.statusLabels[report.taskStatus],
        paragraphs: [
          `${t.dashboard.datePrefix} ${report.latestAssessmentDate}. ${t.reportPage.objTaskAcc}: ${taskPctText} | ${t.reportPage.funcQuest}: ${funcPctText}.`,
        ],
      },
      {
        title: pdfL.sec2,
        badge: t.statusLabels[report.taskStatus],
        paragraphs: latest
          ? latest.categories.map((c) => {
              const catName = t.categoryNames[c.categoryId] ?? c.label
              const domainLabel =
                c.domainType === 'task'
                  ? pdfL.taskTypeLabel
                  : pdfL.questTypeLabel
              const detail = formatAssessmentCategorySummary(c, lang)
              return `• ${catName} (${domainLabel}): ${c.accuracyPct}% (${c.rawScore}/${c.maxScore}) — ${detail}`
            })
          : [t.reportPage.noSessionInfo],
      },
      {
        title: pdfL.sec3,
        badge: `${t.statusLabels[report.sleepStatus]} / ${t.statusLabels[report.lifestyleStatus]}`,
        paragraphs: [
          `${t.reportPage.avgSleep7d}: ${report.avgSleepHours7d} ${t.units.hrsPerNight} | ${t.reportPage.sleepQualityLabel}: ${report.avgSleepQuality7d}/5.`,
          `${t.reportPage.avgSteps7d}: ${report.avgSteps7d.toLocaleString()} ${t.units.stepsPerDay} | ${t.reportPage.avgExercise7d}: ${report.avgExerciseMins7d} ${t.units.minsPerDay} | ${t.reportPage.avgStress7d}: ${report.avgStress7d}/5.`,
        ],
      },
      {
        title: pdfL.sec4,
        badge: t.statusLabels[report.familyContextStatus],
        paragraphs: [
          `${t.reportPage.docConditions}: ${conditionsText}`,
          `${t.reportPage.sec6Title}: ${famText}`,
          t.reportPage.genomicDisabledNote,
        ],
      },
      {
        title: pdfL.sec5,
        badge: t.statusLabels[report.taskStatus],
        paragraphs: [report.changeNarrative],
      },
      {
        title: pdfL.sec6,
        paragraphs: [
          ...report.areasRequiringAttention.map((item) => `• ${item}`),
          ...topRecs,
        ],
      },
      {
        title: pdfL.sec7,
        paragraphs: report.clinicalFollowUpSuggestions.map((s) => `• ${s}`),
      },
    ],
    fileName: `NeuroCare-Brain-Health-Report-${state.user.fullName.replace(/\s+/g, '-')}-${lang.toUpperCase()}.pdf`,
  }
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate
    } else {
      if (line) lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  return lines.length > 0 ? lines : ['']
}

function renderUnicodePdfViaCanvas(data: ReportPdfSections): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidthPt = 595.28
  const pageHeightPt = 841.89
  const scale = 2
  const margin = 42
  const maxWidth = pageWidthPt - margin * 2
  const isRtl = data.dir === 'rtl'
  const fontStack =
    '"Nirmala UI", "Noto Sans Devanagari", "Noto Sans Kannada", "Noto Sans Tamil", "Noto Sans Arabic", "Segoe UI", Arial, sans-serif'

  const pages: HTMLCanvasElement[] = []

  const createPageCanvas = () => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(pageWidthPt * scale)
    canvas.height = Math.round(pageHeightPt * scale)
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, pageWidthPt, pageHeightPt)
    ctx.direction = data.dir
    ctx.textBaseline = 'top'
    pages.push(canvas)
    return ctx
  }

  let ctx = createPageCanvas()
  let y = 0

  const startX = isRtl ? pageWidthPt - margin : margin
  const oppX = isRtl ? margin : pageWidthPt - margin

  // Header Banner
  ctx.fillStyle = '#0A0F14'
  ctx.fillRect(0, 0, pageWidthPt, 92)
  ctx.textAlign = isRtl ? 'right' : 'left'
  ctx.fillStyle = '#EADCC8'
  ctx.font = `700 17px ${fontStack}`
  ctx.fillText(data.bannerTitle, startX, 22, maxWidth)

  ctx.fillStyle = '#7FB388'
  ctx.font = `500 10px ${fontStack}`
  ctx.fillText(data.bannerSub, startX, 46, maxWidth)

  ctx.fillStyle = '#D8CEBE'
  ctx.font = `400 9.5px ${fontStack}`
  ctx.fillText(data.metaLine, startX, 64, maxWidth)

  y = 108

  // Disclaimer Box
  ctx.font = `400 9px ${fontStack}`
  const discLines = wrapCanvasText(ctx, data.disclaimerText, maxWidth - 24)
  const discBoxHeight = 28 + discLines.length * 14 + 10
  ctx.fillStyle = '#F7E8D8'
  ctx.strokeStyle = '#C6601F'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(margin, y, maxWidth, discBoxHeight, 6)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#7A360D'
  ctx.font = `700 10px ${fontStack}`
  ctx.textAlign = isRtl ? 'right' : 'left'
  ctx.fillText(
    data.disclaimerHeading,
    isRtl ? pageWidthPt - margin - 12 : margin + 12,
    y + 10,
    maxWidth - 24
  )
  ctx.font = `400 9px ${fontStack}`
  discLines.forEach((line, idx) => {
    ctx.fillText(
      line,
      isRtl ? pageWidthPt - margin - 12 : margin + 12,
      y + 26 + idx * 14,
      maxWidth - 24
    )
  })
  y += discBoxHeight + 18

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeightPt - 42) {
      ctx = createPageCanvas()
      y = 42
    }
  }

  for (const sec of data.sections) {
    ensureSpace(46)

    // Section heading + optional status badge on opposite side
    ctx.textAlign = isRtl ? 'right' : 'left'
    ctx.fillStyle = '#0F3D3E'
    ctx.font = `700 12px ${fontStack}`
    ctx.fillText(sec.title, startX, y, maxWidth * 0.72)

    if (sec.badge) {
      ctx.textAlign = isRtl ? 'left' : 'right'
      ctx.fillStyle = '#2E6F73'
      ctx.font = `600 9.5px ${fontStack}`
      ctx.fillText(`[${sec.badge}]`, oppX, y + 2, maxWidth * 0.28)
    }

    ctx.strokeStyle = '#D8C7AF'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin, y + 18)
    ctx.lineTo(pageWidthPt - margin, y + 18)
    ctx.stroke()
    y += 26

    ctx.textAlign = isRtl ? 'right' : 'left'
    ctx.fillStyle = '#0A0F14'
    ctx.font = `400 9.8px ${fontStack}`

    for (const para of sec.paragraphs) {
      const wrapped = wrapCanvasText(ctx, para, maxWidth)
      ensureSpace(wrapped.length * 14.5 + 8)
      wrapped.forEach((line) => {
        ctx.fillText(line, startX, y, maxWidth)
        y += 14.5
      })
      y += 5
    }
    y += 8
  }

  pages.forEach((canvas, idx) => {
    if (idx > 0) doc.addPage()
    const imgData = canvas.toDataURL('image/png')
    doc.addImage(imgData, 'PNG', 0, 0, pageWidthPt, pageHeightPt)
  })

  doc.save(data.fileName)
}

export function generateBrainHealthReportPdf(state: NeuroCareState): void {
  const data = buildLocalizedPdfData(state)

  // Non-Latin scripts (Kannada, Hindi, Arabic RTL, Tamil) use high-DPI Unicode canvas pages
  // because jsPDF's built-in Helvetica font drops Unicode glyphs.
  if (data.lang !== 'en' && typeof document !== 'undefined') {
    renderUnicodePdfViaCanvas(data)
    return
  }

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 44
  const maxWidth = pageWidth - margin * 2
  let y = 44

  const checkPageBreak = (needed = 60) => {
    if (y + needed > 790) {
      doc.addPage()
      y = 48
    }
  }

  // Header Banner
  doc.setFillColor(10, 15, 20)
  doc.rect(0, 0, pageWidth, 88, 'F')
  doc.setTextColor(234, 220, 200)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text(data.bannerTitle, margin, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(127, 179, 136)
  doc.text(data.bannerSub, margin, 54)
  doc.setTextColor(216, 206, 190)
  doc.text(data.metaLine, margin, 70)

  y = 110

  // Medical Disclaimer Box
  doc.setFillColor(247, 232, 216)
  doc.setDrawColor(198, 96, 31)
  doc.roundedRect(margin, y, maxWidth, 56, 4, 4, 'FD')
  doc.setTextColor(122, 54, 13)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.text(data.disclaimerHeading, margin + 12, y + 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const disclaimerLines = doc.splitTextToSize(data.disclaimerText, maxWidth - 24)
  doc.text(disclaimerLines, margin + 12, y + 32)
  y += 74

  for (const sec of data.sections) {
    checkPageBreak(55)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(15, 61, 62)
    doc.text(sec.title, margin, y)
    if (sec.badge) {
      doc.setFontSize(9)
      doc.setTextColor(46, 111, 115)
      const badgeStr = `[${sec.badge}]`
      doc.text(badgeStr, pageWidth - margin - doc.getTextWidth(badgeStr), y)
    }
    doc.setDrawColor(216, 199, 175)
    doc.line(margin, y + 6, pageWidth - margin, y + 6)
    y += 20

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(10, 15, 20)
    for (const para of sec.paragraphs) {
      const lines = doc.splitTextToSize(para, maxWidth)
      checkPageBreak(lines.length * 13 + 8)
      doc.text(lines, margin, y)
      y += lines.length * 13 + 8
    }
    y += 6
  }

  doc.save(data.fileName)
}
