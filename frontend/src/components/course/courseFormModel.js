// Trường và payload của form khóa học, dùng chung cho tạo, sửa và đổi trạng thái nhanh.

export const LEVEL_OPTIONS = [
  { value: "ALL_LEVELS", label: "Mọi trình độ" },
  { value: "BEGINNER", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
];

export function levelLabel(level) {
  return LEVEL_OPTIONS.find((option) => option.value === level)?.label || "Mọi trình độ";
}

export const emptyCourseForm = {
  title: "",
  description: "",
  level: "ALL_LEVELS",
  targetScore: "",
  thumbnailUrl: "",
};

export function courseToForm(course) {
  return {
    title: course.title || "",
    description: course.description || "",
    level: course.level || "ALL_LEVELS",
    targetScore: course.targetScore ?? "",
    thumbnailUrl: course.thumbnailUrl || "",
  };
}

const numberOrNull = (value) => (value === "" || value == null ? null : Number(value));

/** Payload gửi lên API (chưa có status — trang gọi tự quyết định). */
export function coursePayload(form) {
  return {
    ...form,
    targetScore: numberOrNull(form.targetScore),
  };
}
