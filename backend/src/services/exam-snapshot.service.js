export const createQuestionSnapshot = (examQuestions) => {
  return examQuestions.map((item) => ({
    id: item.question.id,
    content: item.question.content,
    optionA: item.question.optionA,
    optionB: item.question.optionB,
    optionC: item.question.optionC,
    optionD: item.question.optionD,
    correctAnswer: item.question.correctAnswer,
    explanation: item.question.explanation,
    position: item.position
  }));
};

export const hideCorrectAnswers = (questions) => {
  return questions.map((question) => ({
    id: question.id,
    content: question.content,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    position: question.position
  }));
};