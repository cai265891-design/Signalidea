"use client";

import { cn } from "@saasfly/ui";

interface AIContentSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function AIContentSection({
  title,
  subtitle,
  children,
  className,
}: AIContentSectionProps) {
  return (
    <div className={cn("mb-6", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{title}</h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface AIStreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

export function AIStreamingText({
  text,
  isStreaming = false,
  className,
}: AIStreamingTextProps) {
  return (
    <div className={cn("relative", className)}>
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {text}
        {isStreaming && (
          <span className="inline-block w-2 h-5 ml-1 bg-blue-600 animate-pulse" />
        )}
      </p>
    </div>
  );
}

interface AINumberedListProps {
  items: {
    title: string;
    content: string;
  }[];
}

export function AINumberedList({ items }: AINumberedListProps) {
  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
            {index + 1}
          </div>
          <div className="flex-1 pt-1">
            <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
            <p className="text-gray-600 leading-relaxed">{item.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
