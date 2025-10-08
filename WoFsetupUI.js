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
	loadQuestionIntoGame(question) {
		console.log("QuestionBankLoadAndProcessUI: Passing question to game engine");
		
		if (question && window.gameEngine) {
			const phrase = question.phrase;
			const category = question.category;
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
        
        // We'll need to add getQuestionCount to WoFQuestionBank
        const count = WoFQuestionBank.getQuestionCount 
            ? WoFQuestionBank.getQuestionCount(allowedCategories, allowedDifficulties)
            : 0; // Fallback until we implement it
        
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

// Auto-initialize
$(document).ready(() => {
    console.log("Document ready - initializing QuestionBankLoadAndProcessUI");
    new QuestionBankLoadAndProcessUI();
    console.log("QuestionBankLoadAndProcessUI initialization complete");
});







