-- Dữ liệu mẫu: Tuần 1 (course_weeks.id = 1000), Bài 1 (lessons.id = 1000) và Bài 2 (lessons.id = 1001)
-- có đủ 5 loại học liệu: Ngữ pháp, Flashcards, Listening, Reading, Speaking.
-- Chạy được nhiều lần: mọi dòng dùng id cố định 5000+ và INSERT IGNORE, không ghi đè dữ liệu có sẵn.
-- Cần chạy sau reading-speaking-depth.sql và listening-grammar-depth.sql (các cột skill_type, transcript...).
-- Listening dùng lại file audio có sẵn (listening-1000.mp3, listening-1001.mp3) kèm transcript và câu hỏi của chúng.

SET NAMES utf8mb4;
SET @teacher := 3;

-- ======================= BÀI 1: Tổng quan bài thi TOEIC Listening & Reading (lesson 1000) =======================

-- Ngữ pháp: chủ đề 2020 đã có nội dung, thêm bài tập
INSERT IGNORE INTO grammar_exercises (id, grammar_topic_id, type, question_text, correct_answer, explanation, sort_order) VALUES
 (5000, 2020, 'MULTIPLE_CHOICE', 'How many questions are there in the TOEIC Listening & Reading test?', NULL, 'Bài thi gồm 200 câu: 100 câu Listening và 100 câu Reading.', 1),
 (5001, 2020, 'MULTIPLE_CHOICE', 'Which part of the test comes first?', NULL, 'Bài thi bắt đầu bằng phần Listening (Part 1 đến Part 4).', 2),
 (5002, 2020, 'MULTIPLE_CHOICE', 'In which part do you read a short text and choose the word that best completes a sentence?', NULL, 'Part 5 là hoàn thành câu: chọn từ hoặc cụm từ phù hợp để điền vào chỗ trống.', 3),
 (5003, 2020, 'FILL_BLANK', 'Fill in: The Listening section has ___ parts. (Write a number.)', '4', 'Phần Listening gồm 4 part: Photographs, Question-Response, Conversations và Talks.', 4);
INSERT IGNORE INTO grammar_exercise_options (id, exercise_id, option_text, is_correct, sort_order) VALUES
 (5000, 5000, '100', 0, 1), (5001, 5000, '150', 0, 2), (5002, 5000, '200', 1, 3), (5003, 5000, '250', 0, 4),
 (5004, 5001, 'Listening', 1, 1), (5005, 5001, 'Reading', 0, 2), (5006, 5001, 'Speaking', 0, 3), (5007, 5001, 'Writing', 0, 4),
 (5008, 5002, 'Part 2', 0, 1), (5009, 5002, 'Part 5', 1, 2), (5010, 5002, 'Part 3', 0, 3), (5011, 5002, 'Part 7', 0, 4);

-- Flashcards
INSERT IGNORE INTO flashcard_sets (id, created_by_user_id, course_week_id, lesson_id, title, description, topic, toeic_part, difficulty, status) VALUES
 (5000, @teacher, 1000, 1000, 'Từ vựng: Cấu trúc bài thi TOEIC', '10 từ vựng thường gặp trong hướng dẫn và đề thi TOEIC Listening & Reading.', 'Bài thi TOEIC', 'GENERAL', 'BEGINNER', 'PUBLISHED');
INSERT IGNORE INTO flashcards (id, flashcard_set_id, front_text, back_text, pronunciation, word_type, example_sentence, sort_order) VALUES
 (5000, 5000, 'section', 'phần (của bài thi)', '/ˈsekʃn/', 'danh từ', 'The Listening section lasts about 45 minutes.', 1),
 (5001, 5000, 'passage', 'đoạn văn', '/ˈpæsɪdʒ/', 'danh từ', 'Read the passage and answer the questions.', 2),
 (5002, 5000, 'directions', 'hướng dẫn làm bài', '/dəˈrekʃnz/', 'danh từ', 'Read the directions carefully before you begin.', 3),
 (5003, 5000, 'answer sheet', 'phiếu trả lời', '/ˈɑːnsə ʃiːt/', 'danh từ', 'Mark your answers on the answer sheet.', 4),
 (5004, 5000, 'score', 'điểm số', '/skɔː(r)/', 'danh từ', 'Your total score ranges from 10 to 990.', 5),
 (5005, 5000, 'candidate', 'thí sinh', '/ˈkændɪdət/', 'danh từ', 'Each candidate must bring a photo ID.', 6),
 (5006, 5000, 'complete', 'hoàn thành, điền vào', '/kəmˈpliːt/', 'động từ', 'Choose the word that best completes the sentence.', 7),
 (5007, 5000, 'conversation', 'cuộc hội thoại', '/ˌkɒnvəˈseɪʃn/', 'danh từ', 'You will hear a conversation between two colleagues.', 8),
 (5008, 5000, 'announcement', 'thông báo', '/əˈnaʊnsmənt/', 'danh từ', 'Listen to the announcement and choose the best answer.', 9),
 (5009, 5000, 'time limit', 'giới hạn thời gian', '/taɪm ˈlɪmɪt/', 'danh từ', 'There is no time limit for each individual question.', 10);

-- Listening: dùng lại audio listening-1000.mp3 (Part 3 – hội thoại điện thoại)
INSERT IGNORE INTO listening_activities (id, course_week_id, lesson_id, created_by_teacher_id, title, description, instruction, audio_url, status, transcript)
SELECT 5000, 1000, 1000, @teacher, 'Part 3 mẫu: Phone call – Rescheduling an appointment',
       'Làm quen với dạng Part 3 của bài thi: nghe hội thoại ngắn rồi trả lời 3 câu hỏi.',
       'Nghe đoạn ghi âm và chọn đáp án đúng cho mỗi câu hỏi.', audio_url, 'PUBLISHED', transcript
FROM listening_activities WHERE id = 1000;
INSERT IGNORE INTO listening_questions (id, question_text, explanation, score, sort_order, listening_id, skill_type, transcript_excerpt, audio_start_sec, audio_end_sec)
SELECT id + 4000, question_text, explanation, score, sort_order, 5000, skill_type, transcript_excerpt, audio_start_sec, audio_end_sec
FROM listening_questions WHERE listening_id = 1000;
INSERT IGNORE INTO listening_options (id, question_id, option_key, option_text, is_correct, sort_order)
SELECT id + 4000, question_id + 4000, option_key, option_text, is_correct, sort_order
FROM listening_options WHERE question_id IN (SELECT id FROM listening_questions WHERE listening_id = 1000);

-- Reading (Part 7, một đoạn)
INSERT IGNORE INTO reading_activities (id, course_week_id, lesson_id, created_by_teacher_id, title, description, instruction, passage, passage_format, toeic_part, passage_type, status) VALUES
 (5000, 1000, 1000, @teacher, 'Đọc hiểu: Notice – TOEIC test registration',
  'Làm quen với dạng Part 7: đọc thông báo ngắn rồi trả lời câu hỏi.',
  'Đọc thông báo và trả lời 3 câu hỏi. Tìm thông tin trong bài trước khi chọn đáp án.',
  '## TOEIC Practice Test Registration\n\nThe Language Center will hold a TOEIC Listening & Reading practice test on Saturday, March 15, at 9:00 A.M. in Room 204. The test takes about two hours and includes 200 multiple-choice questions.\n\nTo register, please visit the front desk before March 10 and pay the 150,000 VND fee. Candidates must bring a photo ID and two pencils. Mobile phones must be turned off during the test.\n\nResults will be sent to your email within five working days. Students who register by March 5 will receive a free vocabulary booklet.',
  'MARKDOWN', 'PART_7', 'SINGLE', 'PUBLISHED');
INSERT IGNORE INTO reading_questions (id, reading_id, question_text, explanation, evidence, sort_order, skill_type) VALUES
 (5000, 5000, 'What is the purpose of the notice?', 'Thông báo nhằm giới thiệu bài thi thử TOEIC và hướng dẫn cách đăng ký.', 'To register, please visit the front desk before March 10', 1, 'PURPOSE'),
 (5001, 5000, 'What must candidates bring to the test?', 'Thí sinh phải mang giấy tờ có ảnh và hai cây bút chì.', 'Candidates must bring a photo ID and two pencils.', 2, 'DETAIL'),
 (5002, 5000, 'What can be inferred about students who register by March 5?', 'Đăng ký trước ngày 5/3 sẽ nhận được tập từ vựng miễn phí.', 'Students who register by March 5 will receive a free vocabulary booklet.', 3, 'INFERENCE');
INSERT IGNORE INTO reading_options (id, question_id, option_key, option_text, is_correct, sort_order) VALUES
 (5000, 5000, 'A', 'To announce a practice test and explain how to register', 1, 1),
 (5001, 5000, 'B', 'To advertise a new language course', 0, 2),
 (5002, 5000, 'C', 'To report the results of a test', 0, 3),
 (5003, 5000, 'D', 'To ask students to buy a textbook', 0, 4),
 (5004, 5001, 'A', 'A laptop and a notebook', 0, 1),
 (5005, 5001, 'B', 'A photo ID and two pencils', 1, 2),
 (5006, 5001, 'C', 'A mobile phone and headphones', 0, 3),
 (5007, 5001, 'D', 'A registration receipt only', 0, 4),
 (5008, 5002, 'A', 'They do not have to pay the fee.', 0, 1),
 (5009, 5002, 'B', 'They will take the test on a different day.', 0, 2),
 (5010, 5002, 'C', 'They will get an additional free item.', 1, 3),
 (5011, 5002, 'D', 'They will receive their results first.', 0, 4);

-- Speaking
INSERT IGNORE INTO speaking_activities (id, course_week_id, lesson_id, created_by_teacher_id, title, instruction, prompt_text, status) VALUES
 (5000, 1000, 1000, @teacher, 'Introduce yourself: Why are you taking the TOEIC test?',
  'Chuẩn bị 30 giây rồi nói trong khoảng 45 giây. Giới thiệu bản thân, nêu mục tiêu điểm TOEIC và lý do bạn thi.',
  'Talk about yourself and your TOEIC goals.\n1. What is your name and what do you do?\n2. Why do you want to take the TOEIC test?\n3. What score would you like to achieve, and how will you prepare?',
  'PUBLISHED');

-- ======================= BÀI 2: Danh từ và đại từ trong môi trường văn phòng (lesson 1001) =======================
-- Đã có Ngữ pháp (topic 1000), Flashcards (set 1000), Reading (3012). Thêm bài tập, Listening, Speaking.

INSERT IGNORE INTO grammar_exercises (id, grammar_topic_id, type, question_text, correct_answer, explanation, sort_order) VALUES
 (5004, 1000, 'MULTIPLE_CHOICE', 'Please send me ___ information about the new product.', NULL, 'information là danh từ không đếm được, dùng với some, not any, much.', 1),
 (5005, 1000, 'MULTIPLE_CHOICE', 'The manager asked the staff to submit ___ reports by Friday.', NULL, 'Chỗ trống cần tính từ sở hữu đứng trước danh từ số nhiều: their.', 2),
 (5006, 1000, 'MULTIPLE_CHOICE', 'Ms. Park and ___ will attend the conference together.', NULL, 'Sau and trong vai trò chủ ngữ dùng đại từ chủ ngữ: I.', 3),
 (5007, 1000, 'FILL_BLANK', 'Fill in: There are many ___ (employee) in the main office.', 'employees', 'many đi với danh từ đếm được số nhiều: employees.', 4);
INSERT IGNORE INTO grammar_exercise_options (id, exercise_id, option_text, is_correct, sort_order) VALUES
 (5012, 5004, 'a few', 0, 1), (5013, 5004, 'many', 0, 2), (5014, 5004, 'some', 1, 3), (5015, 5004, 'several', 0, 4),
 (5016, 5005, 'they', 0, 1), (5017, 5005, 'them', 0, 2), (5018, 5005, 'their', 1, 3), (5019, 5005, 'theirs', 0, 4),
 (5020, 5006, 'me', 0, 1), (5021, 5006, 'my', 0, 2), (5022, 5006, 'myself', 0, 3), (5023, 5006, 'I', 1, 4);

INSERT IGNORE INTO listening_activities (id, course_week_id, lesson_id, created_by_teacher_id, title, description, instruction, audio_url, status, transcript)
SELECT 5001, 1000, 1001, @teacher, 'Office talk: The broken photocopier',
       'Nghe hội thoại ngắn trong văn phòng, chú ý danh từ và đại từ chỉ đồ vật, người.',
       'Nghe đoạn ghi âm và chọn đáp án đúng cho mỗi câu hỏi.', audio_url, 'PUBLISHED', transcript
FROM listening_activities WHERE id = 1001;
INSERT IGNORE INTO listening_questions (id, question_text, explanation, score, sort_order, listening_id, skill_type, transcript_excerpt, audio_start_sec, audio_end_sec)
SELECT id + 4000, question_text, explanation, score, sort_order, 5001, skill_type, transcript_excerpt, audio_start_sec, audio_end_sec
FROM listening_questions WHERE listening_id = 1001;
INSERT IGNORE INTO listening_options (id, question_id, option_key, option_text, is_correct, sort_order)
SELECT id + 4000, question_id + 4000, option_key, option_text, is_correct, sort_order
FROM listening_options WHERE question_id IN (SELECT id FROM listening_questions WHERE listening_id = 1001);

INSERT IGNORE INTO speaking_activities (id, course_week_id, lesson_id, created_by_teacher_id, title, instruction, prompt_text, status) VALUES
 (5001, 1000, 1001, @teacher, 'Describe your workplace: Office items and people',
  'Chuẩn bị 30 giây rồi nói khoảng 45 giây. Dùng danh từ đếm được và không đếm được, đại từ như it, they, some, many.',
  'Describe the place where you work or study.\n1. What do you have on your desk or in your classroom? (computer, papers, equipment)\n2. Who do you work with, and what do they do?\n3. What is one thing in your workplace that you would like to improve?',
  'PUBLISHED');
