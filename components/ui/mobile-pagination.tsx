import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MobilePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showPageNumbers?: boolean
  maxVisiblePages?: number
}

export const MobilePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showPageNumbers = true,
  maxVisiblePages = 3
}: MobilePaginationProps) => {
  // Generate page numbers to show
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages = []
    const sidePages = Math.floor((maxVisiblePages - 1) / 2)
    
    let startPage = Math.max(1, currentPage - sidePages)
    let endPage = Math.min(totalPages, currentPage + sidePages)
    
    // Adjust if we're at the beginning or end
    if (currentPage <= sidePages) {
      endPage = Math.min(totalPages, maxVisiblePages)
    }
    if (currentPage >= totalPages - sidePages) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()
  const showStartEllipsis = visiblePages[0] > 1
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages

  if (totalPages <= 1) return null

  return (
    <nav
      role="navigation"
      aria-label="Mobile pagination"
      className={cn("w-full", className)}
    >
      {/* Mobile-first compact design */}
      <div className="flex items-center justify-between gap-2 p-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg">
        
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="min-h-[44px] px-3 py-2 rounded-xl border-slate-200 hover:border-blue-300/50 hover:bg-blue-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden xs:inline">Prev</span>
        </Button>

        {/* Page indicators for mobile */}
        <div className="flex items-center gap-1 overflow-hidden">
          {showPageNumbers ? (
            <>
              {/* First page if not visible */}
              {showStartEllipsis && (
                <>
                  <button
                    onClick={() => onPageChange(1)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors duration-200"
                  >
                    1
                  </button>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </>
              )}

              {/* Visible page numbers */}
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200",
                    page === currentPage
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200/50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                  )}
                >
                  {page}
                </button>
              ))}

              {/* Last page if not visible */}
              {showEndEllipsis && (
                <>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                  <button
                    onClick={() => onPageChange(totalPages)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors duration-200"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </>
          ) : (
            /* Simple page indicator when page numbers are hidden */
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">{currentPage}</span>
              <span className="text-slate-400">of</span>
              <span className="font-medium">{totalPages}</span>
            </div>
          )}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="min-h-[44px] px-3 py-2 rounded-xl border-slate-200 hover:border-purple-300/50 hover:bg-purple-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        />
      </div>
    </nav>
  )
}

export default MobilePagination