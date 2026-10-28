import assert from "node:assert/strict";
import test from "node:test";
import { parseReadingQuestionText } from "../src/utils/readingQuestionImport.js";

test("parses multiple questions and marks the correct option", () => {
  const parsed = parseReadingQuestionText(
    "\uFEFF1. Question one\r\nA. First\r\nB. Second\r\nC. Third\r\nD. Fourth\r\nĐáp án: B\r\n\r\n2) Question two\nA. One\nB. Two\nC. Three\nD. Four\nAnswer: D",
  );

  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.questions.length, 2);
  assert.equal(parsed.questions[0].questionText, "Question one");
  assert.equal(parsed.questions[0].options[1].correct, true);
  assert.equal(parsed.questions[0].options[0].correct, false);
  assert.equal(parsed.questions[1].options[3].correct, true);
});

test("reports missing choices and answer key", () => {
  const parsed = parseReadingQuestionText("1. Question\nA. First\nB. Second");

  assert.equal(parsed.questions.length, 1);
  assert.ok(parsed.errors.some((error) => error.includes("thiếu đáp án C")));
  assert.ok(parsed.errors.some((error) => error.includes("thiếu đáp án D")));
  assert.ok(parsed.errors.some((error) => error.includes("thiếu dòng Đáp án")));
});

test("reports duplicate choices and answer keys that reference a missing choice", () => {
  const parsed = parseReadingQuestionText(
    "1. Question\nA. First\nA. Duplicate\nB. Second\nC. Third\nĐáp án: D",
  );

  assert.ok(parsed.errors.some((error) => error.includes("đáp án A bị lặp")));
  assert.ok(parsed.errors.some((error) => error.includes("thiếu đáp án D")));
  assert.ok(parsed.errors.some((error) => error.includes("đáp án đúng D chưa có nội dung")));
});

test("rejects content before the first numbered question", () => {
  const parsed = parseReadingQuestionText("Intro text\n1. Question\nA. One");

  assert.ok(parsed.errors.some((error) => error.includes("Dòng 1")));
});
