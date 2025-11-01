import { useState, useMemo } from 'react'

interface UsePaginationProps {
  totalItems: number
  itemsPerPage: number
  initialPage?: number
}

interface UsePaginationReturn {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPrevPage: boolean
  goToNextPage: () => void
  goToPrevPage: () => void
  goToPage: (page: number) => void
  getVisibleItems: <T>(items: T[]) => T[]
}

export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(itemsPerPage)

  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize])

  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])
  const endIndex = useMemo(() => Math.min(startIndex + pageSize - 1, totalItems - 1), [startIndex, pageSize, totalItems])

  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  const setItemsPerPage = (items: number) => {
    setPageSize(items)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getVisibleItems = <T>(items: T[]): T[] => {
    return items.slice(startIndex, endIndex + 1)
  }

  return {
    currentPage,
    totalPages,
    itemsPerPage: pageSize,
    setCurrentPage,
    setItemsPerPage,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    goToNextPage,
    goToPrevPage,
    goToPage,
    getVisibleItems
  }
}
