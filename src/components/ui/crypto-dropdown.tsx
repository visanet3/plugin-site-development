"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { ChevronDown } from "lucide-react"

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function useClickAway(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline"
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "outline" && "border border-border bg-transparent",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export interface CryptoOption {
  id: string
  label: string
  name: string
  logo: string
  price?: number
  color: string
}

const IconWrapper = ({
  logo,
  isHovered,
  color,
}: { logo: string; isHovered: boolean; color: string }) => (
  <motion.div 
    className="w-5 h-5 mr-2 relative flex items-center justify-center" 
    initial={false} 
    animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
  >
    <img src={logo} alt="" className="w-full h-full object-contain" />
    {isHovered && (
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ 
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    )}
  </motion.div>
)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

interface CryptoDropdownProps {
  options: CryptoOption[]
  value: string
  onValueChange: (value: string) => void
  showPrices?: boolean
  priceLoading?: boolean
}

export function CryptoDropdown({ 
  options, 
  value, 
  onValueChange,
  showPrices = false,
  priceLoading = false
}: CryptoDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hoveredOption, setHoveredOption] = React.useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.id === value) || options[0]

  useClickAway(dropdownRef, () => setIsOpen(false))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="w-full relative"
        ref={dropdownRef}
      >
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full justify-between h-12",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-all duration-200 ease-in-out",
            "border border-input focus:border-ring",
            isOpen && "bg-accent text-accent-foreground",
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="flex items-center">
            <IconWrapper 
              logo={selectedOption.logo}
              isHovered={false} 
              color={selectedOption.color}
            />
            <span className="font-medium">{selectedOption.label}</span>
            <span className="text-muted-foreground ml-2">- {selectedOption.name}</span>
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center w-5 h-5"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 1, y: 0, height: 0 }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                },
              }}
              exit={{
                opacity: 0,
                y: 0,
                height: 0,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                },
              }}
              className="absolute left-0 right-0 top-full mt-2 z-50"
              onKeyDown={handleKeyDown}
            >
              <motion.div
                className="w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                initial={{ borderRadius: 8 }}
                animate={{
                  borderRadius: 12,
                  transition: { duration: 0.2 },
                }}
                style={{ transformOrigin: "top" }}
              >
                <motion.div 
                  className="py-2 relative max-h-[300px] overflow-y-auto" 
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible"
                >
                  <motion.div
                    layoutId="hover-highlight"
                    className="absolute inset-x-1 bg-accent rounded-md"
                    animate={{
                      y: options.findIndex((opt) => (hoveredOption || selectedOption.id) === opt.id) * 52,
                      height: 52,
                    }}
                    transition={{
                      type: "spring",
                      bounce: 0.15,
                      duration: 0.5,
                    }}
                  />
                  {options.map((option) => (
                    <motion.button
                      key={option.id}
                      onClick={() => {
                        onValueChange(option.id)
                        setIsOpen(false)
                      }}
                      onHoverStart={() => setHoveredOption(option.id)}
                      onHoverEnd={() => setHoveredOption(null)}
                      className={cn(
                        "relative flex w-full items-center justify-between px-4 py-3 text-sm rounded-md",
                        "transition-colors duration-150",
                        "focus:outline-none",
                        selectedOption.id === option.id || hoveredOption === option.id
                          ? "text-accent-foreground"
                          : "text-muted-foreground",
                      )}
                      whileTap={{ scale: 0.98 }}
                      variants={itemVariants}
                    >
                      <div className="flex items-center">
                        <IconWrapper
                          logo={option.logo}
                          isHovered={hoveredOption === option.id}
                          color={option.color}
                        />
                        <span className="font-medium">{option.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">- {option.name}</span>
                      </div>
                      {showPrices && option.price !== undefined && (
                        <span className="ml-auto text-sm font-semibold">
                          {priceLoading ? '...' : `$${option.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
