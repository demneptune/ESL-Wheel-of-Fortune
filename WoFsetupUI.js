class QuestionBankLoadAndProcessUI {
    constructor() {
        console.log("QuestionBankLoadAndProcessUI: Constructor called - UI controller initializing");
        this.initEventListeners();
        this.updateQuestionCount(); // Initialize count on startup
    }

    initEventListeners() {
        console.log("QuestionBankLoadAndProcessUI: Setting up event listeners for question bank controls");

        $('#loadQuestionBtn').on('click', (e) => this.handleQuestionLoadButton(e));

        // Category checkbox handlers
        $('input[name="category"]').on('change', () => {
            this.handleCategoryFilterChange();
            this.updateQuestionCount(); // Add this line
        });
        // Difficulty checkbox handlers  
        $('input[name="difficulty"]').on('change', () => {
            this.handleDifficultyFilterChange();
            this.updateQuestionCount(); // Add this line
        });
        console.log("QuestionBankLoadAndProcessUI: All event listeners registered");
    }

    handleQuestionLoadButton(eventData) {
        console.log("QuestionBankLoadAndProcessUI: load q clicked, event object: ", eventData);
        const allowedCategories = this.getSelectedCategories();
        const allowedDifficulties = this.getSelectedDifficulties();
        console.log(`QuestionBankLoadAndProcessUI: Selected categories: [${allowedCategories}], difficulties: [${allowedDifficulties}]`);
        
        const question = WoFQuestionBank.getRandomQuestion(allowedCategories, allowedDifficulties);
        console.log("QuestionBankLoadAndProcessUI: MAIN EVENT ----- Retrieved question from bank:", question);
        
        this.loadQuestionIntoGame(question);
    }
	
	//PRIMARY INTERFACE WITH THE MAIN SCRIPT: USES WINDOW.GAMEENGINE
	loadQuestionIntoGame(question) {
		console.log("QuestionBankLoadAndProcessUI: Passing question to game engine");
		
		if (question && window.gameEngine) {
			const phrase = question.phrase;
			const category = question.display_category;
			const teamNames = $('#hostTeams').val().trim().split(',').filter(name => name.trim());
			const wheelSegments = $('#hostSegments').val().trim().split(',').filter(seg => seg.trim());
			window.gameEngine.loadQuestionFromBank({phrase, category, teamNames, wheelSegments});
		} else {
			console.log("QuestionBankLoadAndProcessUI: Game engine not available");
			N.toastBad("Game not ready - refresh page");
		}
	}

	// Add this method
    updateQuestionCount() {
        const allowedCategories = this.getSelectedCategories();
        const allowedDifficulties = this.getSelectedDifficulties();
        const count = WoFQuestionBank.getQuestionCount(allowedCategories, allowedDifficulties);
        
        $('#questionCountDisplay').text(`${count} questions available`);
        console.log(`QuestionBankLoadAndProcessUI: Updated count display - ${count} questions`);
    }
    
    handleCategoryFilterChange() {
        const allowedCategories = this.getSelectedCategories();
        console.log(`QuestionBankLoadAndProcessUI: Category filters changed - now selected: [${allowedCategories}]`);
    }
    
    handleDifficultyFilterChange() {
        const allowedDifficulties = this.getSelectedDifficulties();
        console.log(`QuestionBankLoadAndProcessUI: Difficulty filters changed - now selected: [${allowedDifficulties}]`);
    }
    
    getSelectedCategories() {
        const selected = [];
        $('input[name="category"]:checked').each(function() {
            selected.push($(this).val());
        });
        console.log(`QuestionBankLoadAndProcessUI: getSelectedCategories returning: [${selected}]`);
        return selected;
    }
    
    getSelectedDifficulties() {
        const selected = [];
        $('input[name="difficulty"]:checked').each(function() {
            selected.push($(this).val());
        });
        console.log(`QuestionBankLoadAndProcessUI: getSelectedDifficulties returning: [${selected}]`);
        return selected;
    }
}






const WoFQuestionBank = {
    arrQuestionObjects: [],
    usedQuestionsById: new Set(),
    
    // LOAD QUESTION OBJECTS INTO THE CURRENT OBJECT
    loadQuestionObjects: function(questionData) {
        this.arrQuestionObjects = questionData;
        this.usedQuestionsById.clear();
        console.log(`WoFQuestionBank: Loaded ${questionData.length} questions`);
    },
	
	//ONLY FILTERING METHOD FOR QUESTIONS
	getArrAvailableQuestions: function(categories = [], difficulties = []) {
        const availableQuestions = this.arrQuestionObjects.filter(question => {
            // Category filter
            const categoryMatch = categories.length === 0 || categories.includes("all") || categories.includes(question.category);
            // Difficulty filter  
            const difficultyMatch = difficulties.length === 0 || difficulties.includes(question.difficulty);
            // Not used filter
            const notUsed = !this.usedQuestionsById.has(question.id);
            
            return categoryMatch && difficultyMatch && notUsed;
        });
		return availableQuestions;
	},


    // ONLY RANDOM QUESTION SELECTION METHOD
    getRandomQuestion: function(categories = [], difficulties = []) {
        console.log(`WoFQuestionBank: getRandomQuestion called with categories: [${categories}], difficulties: [${difficulties}]`);

		const availableQuestions = this.getArrAvailableQuestions(categories, difficulties);
        
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

    // Get count of available questions
    getQuestionCount: function(categories = [], difficulties = []) {
        const availableQuestions = this.getArrAvailableQuestions(categories, difficulties);
        return availableQuestions.length;
    },
	
	// Mark question when it is used
	//@@@NOT SURE IF THIS IS IMPLEMENTED, CERTAINLY NOT TESTED
    markUsedQuestionId: function(questionId) {
        this.usedQuestionsById.add(questionId);
        console.log(`WoFQuestionBank: Marked question ${questionId} as used`);
    },
    
    // Reset used questions
    resetUsedQuestions: function() {
        this.usedQuestionsById.clear();
        console.log("WoFQuestionBank: Cleared all used questions");
    }
};





// Auto-initialize
$(document).ready(() => {
    console.log("Document ready - initializing QuestionBankLoadAndProcessUI");
	
	// Auto-load sample data
	WoFQuestionBank.loadQuestionObjects(sampleQuestions);
	
    new QuestionBankLoadAndProcessUI();
    console.log("QuestionBankLoadAndProcessUI initialization complete");
});







