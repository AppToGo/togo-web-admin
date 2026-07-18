import type { TourStep } from "@/components/tour/tour.types";

export const ORDERS_TOUR_STEPS: TourStep[] = [
  {
    id: "metrics",
    titleKey: "orders.tour.steps.metrics.title",
    descriptionKey: "orders.tour.steps.metrics.description",
    preferredSide: "bottom",
  },
  {
    id: "search",
    titleKey: "orders.tour.steps.search.title",
    descriptionKey: "orders.tour.steps.search.description",
    preferredSide: "bottom",
  },
  {
    id: "filters",
    titleKey: "orders.tour.steps.filters.title",
    descriptionKey: "orders.tour.steps.filters.description",
    preferredSide: "bottom",
  },
  {
    id: "view-toggle",
    titleKey: "orders.tour.steps.viewToggle.title",
    descriptionKey: "orders.tour.steps.viewToggle.description",
    preferredSide: "bottom",
  },
  {
    id: "column-visibility",
    titleKey: "orders.tour.steps.columnVisibility.title",
    descriptionKey: "orders.tour.steps.columnVisibility.description",
    preferredSide: "top",
  },
  {
    id: "kanban-board",
    titleKey: "orders.tour.steps.kanbanBoard.title",
    descriptionKey: "orders.tour.steps.kanbanBoard.description",
    preferredSide: "top",
  },
  {
    id: "order-card",
    titleKey: "orders.tour.steps.orderCard.title",
    descriptionKey: "orders.tour.steps.orderCard.description",
    preferredSide: "right",
  },
  {
    id: "sidebar",
    titleKey: "orders.tour.steps.sidebar.title",
    descriptionKey: "orders.tour.steps.sidebar.description",
    preferredSide: "right",
  },
];
