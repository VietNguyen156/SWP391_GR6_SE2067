// Thao tác theo loại học liệu, dùng chung cho Thư viện học liệu và trang bài học của giáo viên.
import { quizApi } from "./assessmentService";
import { deleteLessonContent } from "./courseService";
import { flashcardApi, grammarApi, listeningApi, speakingApi } from "./learningContentService";

// Danh sách theo loại: lấy inUse và số liệu (số thẻ, số câu, lượt làm, bài nộp). Bài giảng không có.
export const MATERIAL_DETAIL_LISTS = {
  GRAMMAR: grammarApi.teacherList,
  FLASHCARD: flashcardApi.teacherList,
  LISTENING: listeningApi.teacherList,
  SPEAKING: speakingApi.teacherList,
  QUIZ: quizApi.teacherList,
};

const REMOVE = {
  LECTURE: deleteLessonContent,
  GRAMMAR: grammarApi.deleteTopic,
  FLASHCARD: flashcardApi.teacherDelete,
  LISTENING: listeningApi.teacherDelete,
  SPEAKING: speakingApi.teacherDelete,
  QUIZ: quizApi.remove,
};

export const removeMaterial = (type, id) => REMOVE[type](id);

/** { "TYPE-id": phần tử từ API danh sách } cho các loại được yêu cầu. */
export async function loadMaterialDetails(types) {
  const lists = await Promise.all(types.map((type) => MATERIAL_DETAIL_LISTS[type]()));
  const details = {};
  types.forEach((type, i) => lists[i].forEach((item) => (details[`${type}-${item.id}`] = item)));
  return details;
}
