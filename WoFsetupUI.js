class QuestionBankLoadAndProcessUI {
    constructor() {
        console.log("QuestionBankLoadAndProcessUI: Constructor called - UI controller initializing");
        this.initEventListeners();
        this.updateQuestionCount(); // Initialize count on startup
    }

    initEventListeners() {
        console.log("QuestionBankLoadAndProcessUI: Setting up event listeners for question bank controls");

        $('#loadQuestionBtn').on('click', () => this.handleQuestionLoadButton());

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

	// Add this method
    updateQuestionCount() {
        const categories = this.getSelectedCategories();
        const difficulties = this.getSelectedDifficulties();
        
        // We'll need to add getQuestionCount to WoFQuestionBank
        const count = WoFQuestionBank.getQuestionCount 
            ? WoFQuestionBank.getQuestionCount(categories, difficulties)
            : 0; // Fallback until we implement it
        
        $('#questionCountDisplay').text(`${count} questions available`);
        console.log(`QuestionBankLoadAndProcessUI: Updated count display - ${count} questions`);
    }
    
    handleQuestionLoadButton() {
        console.log("QuestionBankLoadAndProcessUI: Load Question button clicked - getting filtered random question");
        const categories = this.getSelectedCategories();
        const difficulties = this.getSelectedDifficulties();
        console.log(`QuestionBankLoadAndProcessUI: Selected categories: [${categories}], difficulties: [${difficulties}]`);
        
        const question = WoFQuestionBank.getRandomQuestion(categories, difficulties);
        console.log("QuestionBankLoadAndProcessUI: MAIN EVENT ----- Retrieved question from bank:", question);
        
        this.loadQuestionIntoGame(question);
    }
    
    handleCategoryFilterChange() {
        const categories = this.getSelectedCategories();
        console.log(`QuestionBankLoadAndProcessUI: Category filters changed - now selected: [${categories}]`);
    }
    
    handleDifficultyFilterChange() {
        const difficulties = this.getSelectedDifficulties();
        console.log(`QuestionBankLoadAndProcessUI: Difficulty filters changed - now selected: [${difficulties}]`);
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
    
    loadQuestionIntoGame(question) {
        console.log("QuestionBankLoadAndProcessUI: Loading question into game - would set puzzle and update display");
        console.log("QuestionBankLoadAndProcessUI: Question to load:", question);
        
        if (question) {
            console.log(`QuestionBankLoadAndProcessUI: Would display - Category: ${question.category}, Difficulty: ${question.difficulty}`);
            // Stub for actual game integration
            // gameEngine.loadQuestion(question.phrase, question.category);
        } else {
            console.log("QuestionBankLoadAndProcessUI: No question available with current filters");
        }
    }
}

// Auto-initialize
$(document).ready(() => {
    console.log("Document ready - initializing QuestionBankLoadAndProcessUI");
    new QuestionBankLoadAndProcessUI();
    console.log("QuestionBankLoadAndProcessUI initialization complete");
});







