/** Quiz không gắn bài là đề thi thử cấp khóa học; quay về danh sách đề. */
export const quizFallback = { to: "/courses", label: "Khóa học của tôi" };

/**
 * Vị trí của một học liệu trong danh sách `materials` của bài (đúng thứ tự backend trả về).
 * Trả về { index (1-based), total, previous, next } hoặc null nếu không tìm thấy.
 */
export function materialPosition(materials = [], type, id) {
  const index = materials.findIndex((item) => item.type === type && String(item.id) === String(id));
  if (index < 0) return null;
  return {
    index: index + 1,
    total: materials.length,
    previous: materials[index - 1] || null,
    next: materials[index + 1] || null,
  };
}
