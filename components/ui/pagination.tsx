import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center p-2 sm:p-4", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1 sm:gap-2 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-1 sm:p-2 shadow-md sm:shadow-lg shadow-slate-900/[0.06] sm:shadow-slate-900/[0.08] overflow-x-auto", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      // Mobile-first: larger touch targets, simplified animations
      "relative min-h-[44px] min-w-[44px] transition-all duration-200 ease-out active:scale-95 touch-manipulation",
      // Desktop enhancements
      "sm:hover:scale-105",
      // Active state styling
      isActive && "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg shadow-blue-200/50 font-semibold",
      // Inactive state styling
      !isActive && "hover:bg-slate-100/80 hover:text-slate-900 active:bg-slate-200/60",
      // Mobile-first rounded corners
      "rounded-lg sm:rounded-xl font-medium text-sm sm:text-base flex-shrink-0",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn(
      // Mobile-first: compact design, essential elements only
      "gap-1 px-3 py-2 min-h-[44px] bg-white/90 border border-slate-200/60 rounded-lg transition-all duration-200 flex-shrink-0",
      // Desktop enhancements
      "sm:gap-2 sm:pl-3 sm:pr-4 sm:rounded-xl sm:hover:bg-gradient-to-r sm:hover:from-slate-50 sm:hover:to-blue-50 sm:hover:border-blue-300/50",
      // Active states
      "active:bg-slate-100/80 active:scale-95",
      className
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4 flex-shrink-0 transition-transform duration-200 sm:group-hover:-translate-x-0.5" />
    <span className="font-medium text-sm sm:text-base hidden xs:inline sm:inline">Prev</span>
    <span className="font-medium text-sm hidden sm:inline">ious</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn(
      // Mobile-first: compact design, essential elements only
      "gap-1 px-3 py-2 min-h-[44px] bg-white/90 border border-slate-200/60 rounded-lg transition-all duration-200 flex-shrink-0",
      // Desktop enhancements
      "sm:gap-2 sm:pl-4 sm:pr-3 sm:rounded-xl sm:hover:bg-gradient-to-r sm:hover:from-blue-50 sm:hover:to-purple-50 sm:hover:border-purple-300/50",
      // Active states
      "active:bg-slate-100/80 active:scale-95",
      className
    )}
    {...props}
  >
    <span className="font-medium text-sm sm:text-base hidden xs:inline sm:inline">Next</span>
    <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200 sm:group-hover:translate-x-0.5" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn(
      // Mobile-first: adequate touch target, simplified design
      "flex min-h-[44px] min-w-[44px] h-10 w-10 items-center justify-center text-slate-400 transition-colors duration-200 rounded-lg flex-shrink-0",
      // Desktop enhancements
      "sm:rounded-xl sm:hover:text-slate-600",
      className
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
