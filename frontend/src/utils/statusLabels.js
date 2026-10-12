const statusLabels = {
  DRAFT: "Nháp",
  PUBLISHED: "Đang hiển thị",
  HIDDEN: "Đã ẩn",
  ARCHIVED: "Đã ẩn",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Đã khóa",
  OPEN: "Đang mở",
  ONGOING: "Đang diễn ra",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  CLOSED: "Đã đóng",
  SUBMITTED: "Đã nộp",
  GRADED: "Đã chấm",
  PENDING: "Đang chờ",
  REJECTED: "Bị từ chối",
  REMOVED: "Không còn tham gia",
  DROPPED: "Đã rời lớp",
  LOCKED: "Đã khóa",
  BLOCKED: "Đã khóa",
};
export const statusLabel = (value) => statusLabels[value] || value || "—";

// Tài khoản chỉ có 2 trạng thái với admin. INACTIVE (dữ liệu cũ) bị chặn y như BLOCKED nên hiển thị là "Đã khóa".
export const USER_STATUS_OPTIONS = [
  ["ACTIVE", "Đang hoạt động"],
  ["BLOCKED", "Đã khóa"],
];
export const userStatusValue = (status) => (status === "ACTIVE" ? "ACTIVE" : "BLOCKED");

// Trạng thái lớp chỉ còn Đang mở / Đã đóng (backend chỉ phân biệt OPEN với phần còn lại: lớp không mở
// thì học viên không thấy và không vào được). "Đã đóng" lưu là COMPLETED; DRAFT, CANCELLED cũ cũng là đóng.
export const CLASS_STATUSES = ["OPEN", "COMPLETED"];
export const classStatusValue = (status) => (status === "OPEN" ? "OPEN" : "COMPLETED");
export const classStatusLabel = (value) =>
  !value ? "—" : value === "OPEN" ? "Đang mở" : "Đã đóng";

// Trạng thái nội dung chỉ còn Hiển thị / Ẩn (HIDDEN, ARCHIVED cũ cũng hiện là Ẩn).
const contentStatusLabels = {
  DRAFT: "Ẩn",
  PUBLISHED: "Hiển thị",
  HIDDEN: "Ẩn",
  ARCHIVED: "Ẩn",
};
export const contentStatusLabel = (value) => contentStatusLabels[value] || statusLabel(value);

// Nhãn tiếng Việt cho các mã enum khác hiển thị cho người dùng (không hiện mã thô).
const enumLabels = {
  BEGINNER: "Cơ bản",
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
  ALL_LEVELS: "Mọi trình độ",
  // Kỹ năng / loại học liệu
  LISTENING: "Nghe",
  READING: "Đọc",
  GRAMMAR: "Ngữ pháp",
  VOCABULARY: "Từ vựng",
  QUIZ: "Quiz",
  // Ghi nhớ flashcard
  NEW: "Mới",
  LEARNING: "Đang học",
  REVIEW: "Cần ôn lại",
  REMEMBERED: "Đã nhớ",
  // Phần thi TOEIC
  GENERAL: "Tổng hợp",
  // Dạng bài giảng
  TEXT: "Văn bản",
  VIDEO: "Video",
  AUDIO: "Audio",
  PDF: "PDF",
  IMAGE: "Hình ảnh",
  LINK: "Liên kết",
};
export const enumLabel = (value) => {
  if (!value) return "—";
  if (/^PART_\d$/.test(value)) return `Part ${value.slice(5)}`;
  return enumLabels[value] || value;
};

const roleLabels = { STUDENT: "Học viên", TEACHER: "Giáo viên", ADMIN: "Quản trị viên" };
export const roleLabel = (value) => roleLabels[value] || value || "—";

/** Quiz gắn với bài học là "Quiz"; quiz đứng riêng là "Đề thi thử". */
export const quizKindLabel = (quiz) => (quiz?.lessonId ? "Quiz" : "Đề thi thử");
