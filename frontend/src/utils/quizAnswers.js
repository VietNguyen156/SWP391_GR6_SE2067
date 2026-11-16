// Save changes to the same question in order, while other questions save independently.
export function createAnswerSaver(saveAnswer) {
  const pending = new Map();
  const failures = new Map();

  function save(questionId, selectedAnswerId) {
    const previous = pending.get(questionId) || Promise.resolve();
    const request = previous.catch(() => {}).then(() => saveAnswer(questionId, selectedAnswerId));
    pending.set(questionId, request);
    failures.delete(questionId);
    request.then(
      () => {
        if (pending.get(questionId) === request) {
          pending.delete(questionId);
          failures.delete(questionId);
        }
      },
      (error) => {
        if (pending.get(questionId) === request) {
          pending.delete(questionId);
          failures.set(questionId, error);
        }
      },
    );
    return request;
  }

  async function flush() {
    while (pending.size) await Promise.allSettled([...pending.values()]);
    return [...failures.keys()];
  }

  return {
    save,
    flush,
    pendingIds: () => [...pending.keys()],
    failedIds: () => [...failures.keys()],
  };
}
