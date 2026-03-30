'use client';

import { useMemo, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ExportAction = {
  key: 'pdf' | 'csv' | 'xlsx';
  label: string;
  icon: React.ReactNode;
  onExport: () => Promise<void>;
  disabled?: boolean;
};

export type ActionBarProps = {
  contextLabel: string;
  moodleUrl?: string;
  shareLabel?: string;
  onExportPDF: () => Promise<void>;
  onExportCSV: () => Promise<void>;
  onExportXLSX: () => Promise<void>;
};

export function ActionBar({
  contextLabel,
  moodleUrl,
  onExportPDF,
  onExportCSV,
  onExportXLSX,
}: ActionBarProps) {
  const [busyKey, setBusyKey] = useState<ExportAction['key'] | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const actions: ExportAction[] = useMemo(
    () => [
      {
        key: 'pdf',
        label: 'Exportar PDF',
        icon: <FileText className="h-4 w-4" aria-hidden />,
        onExport: onExportPDF,
      },
      {
        key: 'csv',
        label: 'Exportar CSV',
        icon: <FileSpreadsheet className="h-4 w-4" aria-hidden />,
        onExport: onExportCSV,
      },
      {
        key: 'xlsx',
        label: 'Exportar XLSX',
        icon: <FileSpreadsheet className="h-4 w-4" aria-hidden />,
        onExport: onExportXLSX,
      },
    ],
    [onExportPDF, onExportCSV, onExportXLSX]
  );

  async function runExport(action: ExportAction) {
    setFeedback(null);
    setBusyKey(action.key);
    try {
      await action.onExport();
      setFeedback({ type: 'success', text: `${action.label} concluído.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao exportar.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setBusyKey(null);
    }
  }

  async function copyLink() {
    setFeedback(null);
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setFeedback({ type: 'success', text: 'Link copiado para a área de transferência.' });
    } catch {
      setFeedback({
        type: 'error',
        text: 'Não foi possível copiar o link. Verifique permissões do navegador.',
      });
    }
  }

  function openMoodle() {
    if (!moodleUrl) return;
    window.open(moodleUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <Card className="rounded-xl border border-surface-300 bg-white shadow-card">
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
              Ações
            </span>
            <Badge variant="secondary" className="truncate max-w-full">
              {contextLabel}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actions.map((a) => (
            <Button
              key={a.key}
              variant="outline"
              size="sm"
              disabled={busyKey !== null}
              className={cn('h-8 gap-2', busyKey === a.key && 'border-unicv-green/40')}
              onClick={() => runExport(a)}
              aria-label={a.label}
            >
              {busyKey === a.key ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  <span>{a.label.replace('Exportar ', 'Gerando ')}</span>
                </>
              ) : (
                <>
                  {a.icon}
                  <span>{a.label.replace('Exportar ', '')}</span>
                </>
              )}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={openMoodle}
            disabled={!moodleUrl || busyKey !== null}
            className="h-8 gap-2"
            aria-label="Abrir no Moodle"
            title={moodleUrl ? 'Abrir no Moodle' : 'Disponível apenas quando há URL do Moodle'}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            <span>Abrir no Moodle</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={copyLink}
            disabled={busyKey !== null}
            className="h-8 gap-2 text-surface-600 hover:text-unicv-green"
            aria-label="Copiar link"
          >
            <Copy className="h-4 w-4" aria-hidden />
            <span>Copiar link</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'px-3 pb-2 text-sm',
            feedback.type === 'success' ? 'text-emerald-700' : 'text-red-700'
          )}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback.text}
        </div>
      )}
    </Card>
  );
}

