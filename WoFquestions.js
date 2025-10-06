// Global question bank - simple and accessible
const WoFQuestionBank = {
    arrQuestionObjects: [],
    usedQuestionsById: new Set(),
    
    // Load questions into memory
    loadQuestionObjects: function(questionData) {
        this.arrQuestionObjects = questionData;
        this.usedQuestionsById.clear();
        console.log(`WoFQuestionBank: Loaded ${questionData.length} questions`);
    },

    // Get random question based on filters
    getRandomQuestion: function(categories = [], difficulties = []) {
        console.log(`WoFQuestionBank: getRandomQuestion called with categories: [${categories}], difficulties: [${difficulties}]`);
        
        // Filter available questions
        const availableQuestions = this.arrQuestionObjects.filter(question => {
            // Category filter
            const categoryMatch = categories.length === 0 || categories.includes(question.category);
            // Difficulty filter  
            const difficultyMatch = difficulties.length === 0 || difficulties.includes(question.difficulty);
            // Not used filter
            const notUsed = !this.usedQuestionsById.has(question.id);
            
            return categoryMatch && difficultyMatch && notUsed;
        });
        
        console.log(`WoFQuestionBank: ${availableQuestions.length} questions available after filtering`);
        
        if (availableQuestions.length === 0) {
            console.log("WoFQuestionBank: No questions available with current filters");
            return null;
        }

        // Pick random question
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];
        
        // Mark as used
        this.markUsedQuestionId(selectedQuestion.id);
        
        console.log(`WoFQuestionBank: Selected question: "${selectedQuestion.phrase}"`);
        return selectedQuestion;
    },

    // Mark question as used
    markUsedQuestionId: function(questionId) {
        this.usedQuestionsById.add(questionId);
        console.log(`WoFQuestionBank: Marked question ${questionId} as used`);
    },
    
    // Get count of available questions
    getQuestionCount: function(categories = [], difficulties = []) {
        const availableQuestions = this.arrQuestionObjects.filter(question => {
            // Category filter
            const categoryMatch = categories.length === 0 || categories.includes(question.category);
            // Difficulty filter  
            const difficultyMatch = difficulties.length === 0 || difficulties.includes(question.difficulty);
            // Not used filter
            const notUsed = !this.usedQuestionsById.has(question.id);
            
            return categoryMatch && difficultyMatch && notUsed;
        });
        
        return availableQuestions.length;
    },
    
    // Reset used questions
    resetUsedQuestions: function() {
        this.usedQuestionsById.clear();
        console.log("WoFQuestionBank: Cleared all used questions");
    }
};

// Sample data structure with varied categories and difficulties
const sampleQuestions = [
    {
        id: "proverb_001",
        phrase: "A BIRD IN THE HAND IS WORTH TWO IN THE BUSH",
        category: "Proverb",
        difficulty: "easy",
        tags: ["animals", "wisdom"],
        hint: "What's better: something you have or something you might get?"
    },
    {
        id: "movie_001", 
        phrase: "THE LION KING",
        category: "Movie Title",
        difficulty: "easy",
        tags: ["animals", "family", "disney"],
        hint: "A young lion prince's journey in Africa"
    },
    {
        id: "proverb_002",
        phrase: "ACTIONS SPEAK LOUDER THAN WORDS",
        category: "Proverb", 
        difficulty: "medium",
        tags: ["wisdom", "behavior"],
        hint: "What people do is more important than what they say"
    },
    {
        id: "animal_001",
        phrase: "ELEPHANT",
        category: "Animal",
        difficulty: "easy", 
        tags: ["wildlife", "large", "africa"],
        hint: "The largest land animal with a long trunk"
    },
    {
        id: "movie_002",
        phrase: "THE SHAWSHANK REDEMPTION", 
        category: "Movie Title",
        difficulty: "hard",
        tags: ["prison", "drama", "classic"],
        hint: "A man maintains his dignity while in prison for a crime he didn't commit"
    },
    {
        id: "proverb_003",
        phrase: "DONT PUT ALL YOUR EGGS IN ONE BASKET",
        category: "Proverb",
        difficulty: "medium", 
        tags: ["risk", "caution", "metaphor"],
        hint: "Don't risk everything on a single venture"
    }
];

// Auto-load sample data
WoFQuestionBank.loadQuestionObjects(sampleQuestions);