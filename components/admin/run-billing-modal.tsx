'use client'

import React, { useState } from 'react'
import { Zap, CheckCircle2, AlertTriangle, X, RefreshCw, ShieldCheck } from 'lucide-react'

interface RunBillingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RunBillingModal({ isOpen, onClose, onSuccess }: RunBillingModalProps) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRun = async () => {
    try {
      setRunning(true)
      setError(null)
      setResult(null)

      const res = await fetch('/api/billing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 100 }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to execute billing run')

      setResult(data)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Billing run error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0e0c24] text-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#8978ff]/20 text-[#8978ff] border border-[#8978ff]/30">
              <Zap className="w-5 h-5 fill-[#8978ff]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Run Invoicing Batch</h3>
              <p className="text-xs text-white/50">Atomic Idempotent Billing Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#8978ff]/10 border border-[#8978ff]/30 text-white text-xs">
            <ShieldCheck className="w-4 h-4 text-[#8978ff] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white">Zero Duplicate Guarantee</span>
              <p className="text-white/70 leading-relaxed">
                Composite unique constraint guarantees no cycle is billed twice. Active subscriptions due today advance cleanly.
              </p>
            </div>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Batch Run Completed</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-center">
                <div className="p-2 rounded bg-white/5 border border-white/10">
                  <div className="text-lg font-bold text-emerald-400">{result.created}</div>
                  <div className="text-[10px] text-white/40 uppercase font-semibold">Created</div>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10">
                  <div className="text-lg font-bold text-white/80">{result.skipped}</div>
                  <div className="text-[10px] text-white/40 uppercase font-semibold">Skipped</div>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10">
                  <div className="text-lg font-bold text-rose-400">{result.failed}</div>
                  <div className="text-[10px] text-white/40 uppercase font-semibold">Failed</div>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="space-y-1 border-t border-amber-400/20 pt-3 text-left">
                  <p className="font-semibold text-amber-300">Needs attention</p>
                  {result.errors.slice(0, 3).map((message: string) => (
                    <p key={message} className="text-[11px] leading-relaxed text-white/60">
                      {message}
                    </p>
                  ))}
                  {result.errors.length > 3 && (
                    <p className="text-[11px] text-white/40">
                      +{result.errors.length - 3} more issue(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 bg-white/[0.02] border-t border-white/10">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 py-2.5 px-5 rounded-full bg-[#8978ff] hover:bg-[#9b8cff] text-white text-xs font-semibold transition-all shadow-[0_4px_20px_rgba(137,120,255,0.4)] disabled:opacity-50 cursor-pointer"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Cycle...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Execute Billing Cycle</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
