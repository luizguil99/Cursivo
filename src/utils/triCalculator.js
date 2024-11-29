// Teoria de Resposta ao Item (TRI) Calculator
// Implementação simplificada do cálculo de notas baseado no ENEM

// Parâmetros de dificuldade das questões (exemplo)
const DIFFICULTY_LEVELS = {
  EASY: { weight: 1, expectedTime: 2, basePoints: 100 },
  MEDIUM: { weight: 1.5, expectedTime: 3, basePoints: 150 },
  HARD: { weight: 2, expectedTime: 4, basePoints: 200 }
};

// Análise de coerência nas respostas
function analyzeCoherence(answers, questions) {
  let coherenceScore = 1.0;
  let easyCorrect = 0;
  let mediumCorrect = 0;
  let hardCorrect = 0;
  let totalEasy = 0;
  let totalMedium = 0;
  let totalHard = 0;

  // Conta acertos por nível de dificuldade
  questions.forEach((question, index) => {
    const difficulty = question.difficulty?.toUpperCase() || 'MEDIUM';
    const isCorrect = answers[index] === question.correctAnswer;

    switch(difficulty) {
      case 'EASY':
        totalEasy++;
        if (isCorrect) easyCorrect++;
        break;
      case 'MEDIUM':
        totalMedium++;
        if (isCorrect) mediumCorrect++;
        break;
      case 'HARD':
        totalHard++;
        if (isCorrect) hardCorrect++;
        break;
    }
  });

  // Calcula porcentagens de acerto por nível
  const easyPercentage = totalEasy > 0 ? easyCorrect / totalEasy : 0;
  const mediumPercentage = totalMedium > 0 ? mediumCorrect / totalMedium : 0;
  const hardPercentage = totalHard > 0 ? hardCorrect / totalHard : 0;

  // Penaliza incoerências (ex: acertar difíceis e errar fáceis)
  if (hardPercentage > easyPercentage) {
    coherenceScore -= 0.2 * (hardPercentage - easyPercentage);
  }
  if (mediumPercentage > easyPercentage) {
    coherenceScore -= 0.1 * (mediumPercentage - easyPercentage);
  }

  return {
    coherenceScore: Math.max(0.5, coherenceScore), // Mínimo de 0.5 para não penalizar demais
    stats: {
      FÁCIL: { total: totalEasy, correct: easyCorrect },
      MÉDIO: { total: totalMedium, correct: mediumCorrect },
      DIFÍCIL: { total: totalHard, correct: hardCorrect }
    }
  };
}

// Calcula a nota considerando tempo de resposta
function calculateTimeEfficiency(timeSpent, questions) {
  const totalExpectedTime = questions.reduce((acc, q) => {
    const difficulty = q.difficulty || 'MEDIUM';
    return acc + DIFFICULTY_LEVELS[difficulty].expectedTime;
  }, 0);

  const timeEfficiency = Math.min(totalExpectedTime / timeSpent, 1.5);
  return Math.max(0.8, timeEfficiency); // Entre 0.8 e 1.5
}

// Calcula pontos base por questão
function calculateBasePoints(question, isCorrect) {
  if (!isCorrect) return 0;
  
  const difficulty = question.difficulty || 'MEDIUM';
  return DIFFICULTY_LEVELS[difficulty].basePoints;
}

// Função principal de cálculo TRI
export function calculateTRIScore(answers, questions, timeSpent) {
  // Análise de coerência
  const { coherenceScore } = analyzeCoherence(answers, questions);

  // Eficiência no tempo
  const timeEfficiencyMultiplier = calculateTimeEfficiency(timeSpent, questions);

  // Cálculo dos pontos base
  let totalPoints = 0;
  questions.forEach((question, index) => {
    const isCorrect = answers[index] === question.correctAnswer;
    const basePoints = calculateBasePoints(question, isCorrect);
    totalPoints += basePoints;
  });

  // Aplicação dos multiplicadores
  let finalScore = totalPoints * coherenceScore * timeEfficiencyMultiplier;

  // Normalização para escala ENEM (300-800)
  finalScore = 300 + (finalScore / (questions.length * 200)) * 500;

  // Limita a nota entre 300 e 800
  return Math.min(800, Math.max(300, Math.round(finalScore)));
}

// Calcula estatísticas detalhadas do desempenho
export function calculateDetailedStats(answers, questions, timeSpent) {
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const correctAnswers = questions.reduce(
    (acc, question, index) => acc + (answers[index] === question.correctAnswer ? 1 : 0),
    0
  );

  // Cálculo da nota TRI
  const triScore = calculateTRIScore(answers, questions, timeSpent);

  // Cálculo da nota tradicional (porcentagem de acertos)
  const traditionalScore = Math.round((correctAnswers / totalQuestions) * 100);

  // Estatísticas por nível de dificuldade
  const { stats } = analyzeCoherence(answers, questions);

  return {
    triScore,
    traditionalScore,
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    timeSpent,
    difficultyStats: stats,
    coherenceIndex: analyzeCoherence(answers, questions).coherenceScore,
    timeEfficiency: calculateTimeEfficiency(timeSpent, questions)
  };
}
