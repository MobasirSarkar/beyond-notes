import type { KeyboardCoordinateGetter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * Keyboard navigation across kanban columns: ←/→ jump to the adjacent column
 * (dropping near its top), ↑/↓ reorder within a column via dnd-kit's sortable
 * getter. The stock getter alone tends to snap to cards in the same column.
 */
export const kanbanKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") {
    return sortableKeyboardCoordinates(event, args);
  }
  event.preventDefault();
  const { droppableContainers, droppableRects, collisionRect } = args.context;
  if (!collisionRect) return undefined;

  const columns = droppableContainers
    .getEnabled()
    .filter((c) => c.data.current?.["type"] === "column")
    .flatMap((c) => {
      const rect = droppableRects.get(c.id);
      return rect ? [{ id: c.id, rect }] : [];
    })
    .toSorted((a, b) => a.rect.left - b.rect.left);

  const center = collisionRect.left + collisionRect.width / 2;
  let index = columns.findIndex(
    (c) => center >= c.rect.left && center <= c.rect.left + c.rect.width,
  );
  if (index === -1) {
    // Between columns: start from the nearest one.
    index = columns.reduce(
      (best, c, i) =>
        Math.abs(c.rect.left + c.rect.width / 2 - center) <
        Math.abs((columns[best]?.rect.left ?? 0) + (columns[best]?.rect.width ?? 0) / 2 - center)
          ? i
          : best,
      0,
    );
  }
  const target = columns[event.code === "ArrowRight" ? index + 1 : index - 1];
  if (!target) return undefined;
  return {
    x: target.rect.left + (target.rect.width - collisionRect.width) / 2,
    y: target.rect.top + 8,
  };
};
