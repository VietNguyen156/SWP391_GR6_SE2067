import assert from "node:assert/strict";
import test from "node:test";
import {
  isBlankCard,
  mergeImported,
  parseFlashcardText,
  parseMcqText,
} from "../src/utils/questionImport.js";

const mcq = (question = "Question") =>
  `1. ${question}\nA. First\nB. Second\nC. Third\nD. Fourth\nĐáp án: B`;

test("parses questions, explanations, evidence, and starred correct answers", () => {
  const parsed = parseMcqText(
    `\uFEFF${mcq("Question one")}\r\nGiải thích: Reason\r\nCăn cứ: Evidence\r\n\r\n2. Question two\nA. One\nB. Two *\nC. Three\nD. Four`,
  );

  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.questions.length, 2);
  assert.equal(parsed.questions[0].options[1].correct, true);
  assert.equal(parsed.questions[0].explanation, "Reason");
  assert.equal(parsed.questions[0].evidence, "Evidence");
  assert.equal(parsed.questions[1].options[1].correct, true);
});

test("enforces four options for the question bank and rejects malformed questions", () => {
  const parsed = parseMcqText(`${mcq("Valid")}\n\n2. Incomplete\nA. One\nB. Two`, {
    minOptions: 4,
    maxOptions: 4,
  });

  assert.equal(parsed.questions.length, 1);
  assert.equal(parsed.questions[0].questionText, "Valid");
  assert.ok(parsed.errors.some((error) => error.message.includes("cần ít nhất 4 đáp án")));
  assert.ok(parsed.errors.some((error) => error.message.includes("chưa có đáp án đúng")));
});

test("rejects inconsistent answer markers", () => {
  const parsed = parseMcqText(
    `${mcq()}\n\n2. Mismatch\nA. One *\nB. Two\nC. Three\nD. Four\nĐáp án: B`,
  );

  assert.equal(parsed.questions.length, 1);
  assert.ok(parsed.errors.some((error) => error.message.includes("dấu * ở A khác")));
});

test("parses pipe- and tab-separated flashcards", () => {
  const parsed = parseFlashcardText(
    "hello | xin chào | həˈləʊ | interjection | Hello there.\nbook\tsách\t\t noun \tRead a book.",
  );

  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.cards.length, 2);
  assert.equal(parsed.cards[0].frontText, "hello");
  assert.equal(parsed.cards[1].backText, "sách");
});

test("replaces a single blank starter item when merging imported data", () => {
  const blank = { frontText: "", backText: "" };
  const imported = [{ frontText: "hello", backText: "xin chào" }];

  assert.deepEqual(mergeImported([blank], imported, isBlankCard), imported);
  assert.deepEqual(
    mergeImported([{ frontText: "saved", backText: "đã lưu" }], imported, isBlankCard),
    [{ frontText: "saved", backText: "đã lưu" }, ...imported],
  );
});
