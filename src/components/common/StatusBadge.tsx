import { AlertTriangle, CheckCircle2, HelpCircle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useTranslation } from '@/hooks/useTranslation'
import type { ReportStatusLabel } from '@/types/neurocare'

export function StatusBadge({ status }: { status: ReportStatusLabel }) {
  const t = useTranslation()
  const label = t.statusLabels[status] ?? status

  if (status === 'Stable') {
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" />
        {label}
      </Badge>
    )
  }
  if (status === 'Changed') {
    return (
      <Badge variant="primary">
        <RefreshCw className="h-3 w-3" />
        {label}
      </Badge>
    )
  }
  if (status === 'Needs attention') {
    return (
      <Badge variant="warning">
        <AlertTriangle className="h-3 w-3" />
        {label}
      </Badge>
    )
  }
  return (
    <Badge variant="muted">
      <HelpCircle className="h-3 w-3" />
      {label}
    </Badge>
  )
}
