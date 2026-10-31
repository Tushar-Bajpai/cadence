'use client'

import React from 'react'
import { X, Mail, Phone, Calendar, MapPin, MessageSquare, GitCommit, UserPlus } from 'lucide-react'

export interface CustomerActivityEvent {
  id: string
  type: string
  color: string
  actor: string
  action: string
  body?: string
  replies?: Array<{
    id: string
    actor: string
    action: string
    body: string
  }>
}

export interface CustomerActivityGroup {
  date: string
  events: CustomerActivityEvent[]
}

export interface CustomerModalData {
  id: string
  name: string
  email: string
  phone: string
  role: string
  joined: string
  location: string
  companyName?: string
  activity: CustomerActivityGroup[]
}

interface CustomerModalProps {
  customer: CustomerModalData | null
  isOpen: boolean
  onClose: () => void
}

export function CustomerModal({ customer, isOpen, onClose }: CustomerModalProps) {
  if (!isOpen || !customer) return null

  const getDotColorClass = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-[#8978ff] text-white ring-4 ring-[#0e0c24]'
      case 'amber':
        return 'bg-amber-400 text-black ring-4 ring-[#0e0c24]'
      case 'blue':
        return 'bg-blue-500 text-white ring-4 ring-[#0e0c24]'
      case 'pink':
        return 'bg-pink-500 text-white ring-4 ring-[#0e0c24]'
      default:
        return 'bg-zinc-400 text-white ring-4 ring-[#0e0c24]'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'move':
        return <GitCommit className="w-3.5 h-3.5" />
      case 'comment':
      case 'thread':
        return <MessageSquare className="w-3.5 h-3.5" />
      case 'invite':
        return <UserPlus className="w-3.5 h-3.5" />
      default:
        return <MessageSquare className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0e0c24] text-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Profile matching Screenshot 2 */}
        <div className="p-6 border-b border-white/10 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              {/* Circular Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center text-amber-950 font-bold text-lg shadow-sm">
                <span>{customer.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#8978ff] inline-block shadow-[0_0_8px_rgba(137,120,255,0.8)]" />
                  <span className="text-xs font-semibold text-[#a79aff]">{customer.role}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contact Details List matching Screenshot 2 */}
          <div className="mt-5 space-y-2.5 text-xs text-white/70">
            <div className="flex items-center justify-between">
              <span className="text-white/40 font-medium">Email</span>
              <div className="flex items-center gap-1.5 text-white font-medium">
                <Mail className="w-3.5 h-3.5 text-[#8978ff]" />
                <span>{customer.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/40 font-medium">Phone</span>
              <div className="flex items-center gap-1.5 text-white font-medium">
                <Phone className="w-3.5 h-3.5 text-[#8978ff]" />
                <span>{customer.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/40 font-medium">Joined</span>
              <div className="flex items-center gap-1.5 text-white font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#8978ff]" />
                <span>{customer.joined}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/40 font-medium">Location</span>
              <div className="flex items-center gap-1.5 text-white font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#8978ff]" />
                <span>{customer.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline matching Screenshot 2 */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <h4 className="text-sm font-bold text-white tracking-tight">Activity</h4>

          <div className="space-y-6">
            {customer.activity.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#a79aff]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span>{group.date}</span>
                </div>

                {/* Events list with left line connecting */}
                <div className="pl-3 border-l-2 border-white/10 space-y-4">
                  {group.events.map((event) => (
                    <div key={event.id} className="relative pl-4 space-y-1 text-xs">
                      {/* Icon circle positioned on line */}
                      <div
                        className={`absolute -left-[19px] top-0 w-6 h-6 rounded-full flex items-center justify-center ${getDotColorClass(
                          event.color
                        )}`}
                      >
                        {getEventIcon(event.type)}
                      </div>

                      <p className="text-white/90 leading-snug">
                        <span className="font-semibold text-white">{event.actor}</span>{' '}
                        <span className="text-white/60">{event.action}</span>
                      </p>

                      {event.body && (
                        <p className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 text-xs leading-relaxed">
                          {event.body}
                        </p>
                      )}

                      {/* Nested comments */}
                      {event.replies && event.replies.length > 0 && (
                        <div className="mt-2.5 space-y-2 pl-3 border-l border-white/15">
                          {event.replies.map((reply) => (
                            <div key={reply.id} className="space-y-0.5">
                              <p className="font-semibold text-white text-[11px]">
                                {reply.actor} <span className="text-white/40 font-normal">commented</span>
                              </p>
                              <p className="text-white/60 text-xs leading-relaxed">{reply.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
