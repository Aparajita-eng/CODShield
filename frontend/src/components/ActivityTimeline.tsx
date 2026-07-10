"use client";

import { motion } from "framer-motion";
import { formatDate } from "@/lib/dashboard-ui";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  animate?: boolean;
}

export default function ActivityTimeline({ events, animate = true }: ActivityTimelineProps) {
  if (!events.length) {
    return <p className="text-ink-secondary text-sm">No activity recorded yet</p>;
  }

  return (
    <div className="space-y-4">
      {events.map((event, i) => {
        const content = (
          <>
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              {i < events.length - 1 && <div className="w-0.5 flex-1 bg-border-default" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink-primary">{event.title}</p>
                <span className="text-xs text-ink-tertiary font-mono shrink-0">
                  {formatDate(event.timestamp)}
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-1">{event.description}</p>
            </div>
          </>
        );

        if (!animate) {
          return (
            <div key={event.id} className="flex gap-3">
              {content}
            </div>
          );
        }

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3"
          >
            {content}
          </motion.div>
        );
      })}
    </div>
  );
}
