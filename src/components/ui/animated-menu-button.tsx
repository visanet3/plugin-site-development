"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import Icon from "@/components/ui/icon"

interface AnimatedMenuButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  variant?: 'default' | 'admin';
}

export function AnimatedMenuButton({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  badge,
  variant = 'default' 
}: AnimatedMenuButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative w-full",
        "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
      )}
    >
      <div
        className={cn(
          "relative flex items-center gap-2 md:gap-3 py-1.5 md:py-2.5 px-3 md:px-4 rounded-lg",
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isHovered || isActive ? "bg-sidebar-accent/80" : "bg-transparent",
          variant === 'admin' && "bg-primary/10 border border-primary/30"
        )}
      >
        {/* Animated left indicator */}
        <div
          className={cn(
            "absolute left-0 h-4 md:h-5 w-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isHovered || isActive 
              ? variant === 'admin' 
                ? "bg-primary scale-y-100 opacity-100" 
                : "bg-sidebar-primary scale-y-100 opacity-100"
              : "bg-border scale-y-50 opacity-0",
          )}
        />

        {/* Icon with animation */}
        <div
          className={cn(
            "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isHovered || isActive ? "translate-x-0" : "-translate-x-1",
            variant === 'admin' && "text-primary"
          )}
        >
          <Icon name={icon as any} size={16} className="md:w-[18px] md:h-[18px]" />
        </div>

        {/* Label */}
        <span
          className={cn(
            "text-xs md:text-sm font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isHovered || isActive 
              ? variant === 'admin'
                ? "text-primary translate-x-0"
                : "text-sidebar-accent-foreground translate-x-0" 
              : "text-muted-foreground -translate-x-1",
          )}
        >
          {label}
        </span>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span 
            className={cn(
              "absolute right-3 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full",
              "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isHovered || isActive ? "scale-100 opacity-100" : "scale-90 opacity-90"
            )}
          >
            {badge}
          </span>
        )}

        {/* Progress bar effect on hover */}
        <div className="absolute bottom-0 left-4 right-4 h-px rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
              variant === 'admin'
                ? "bg-gradient-to-r from-primary/80 to-primary"
                : "bg-gradient-to-r from-sidebar-primary/80 to-sidebar-primary",
            )}
            style={{
              width: isHovered || isActive ? "100%" : "0%",
              transitionDelay: isHovered || isActive ? "100ms" : "0ms",
            }}
          />
        </div>

        {/* Shine effect */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-lg",
            "transition-transform duration-700 ease-out pointer-events-none",
            isHovered ? "translate-x-full" : "-translate-x-full",
          )}
          style={{
            transitionDelay: isHovered ? "200ms" : "0ms",
          }}
        />
      </div>
    </button>
  )
}