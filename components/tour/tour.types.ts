export interface TourStep {
  id: string
  titleKey: string
  descriptionKey: string
  preferredSide?: 'top' | 'bottom' | 'left' | 'right'
}

export interface TourContextValue {
  isActive: boolean
  currentStepIndex: number
  totalSteps: number
  currentStep: TourStep | null
  startTour: () => void
  goNext: () => void
  goPrev: () => void
  skip: () => void
}
