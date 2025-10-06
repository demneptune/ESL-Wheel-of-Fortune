
//REMOVED: PREVIOUS STATE VARIABLES CLASS (TOO COMPLEX)


	class StateVariables {
		#currentPhase = 'setup';
		#isInitialized = false; //@@@needs fixing
		#isGameLoaded = false;
		#isSpinEnabled = false;
		#isKeyboardEnabled = false;
		#isSolveInputEnabled = false;
		#isWheelSpinning = false;
		#hasPendingGuess = false;
		
		get isInitialized() { return this.#isInitialized; }
		get isGameLoaded() { return this.#isGameLoaded; }
		get isSpinEnabled() { return this.#isSpinEnabled; }
		get isKeyboardEnabled() { return this.#isKeyboardEnabled; }
		get isSolveInputEnabled() { return this.#isSolveInputEnabled; }
		get currentPhase() { return this.#currentPhase; }
		get isWheelSpinning() { return this.#isWheelSpinning; }
		get hasPendingGuess() { return this.#hasPendingGuess; }
		
		
		//***MUST TRY TO REMOVE THESE AND REPLACE WITH A COPOSITE SETTER***
		#setInitialized(initialized) {
			this.#isInitialized = Boolean(initialized);
			//@@@new
		}
		#setSolveInputEnabled(enabled) { 
			this.#isSolveInputEnabled = Boolean(enabled); 
		}
		#setCurrentPhase(phase) { 
			const validPhases = ['setup', 'spinning', 'guessing', 'solving', 'revealed'];
			if (validPhases.includes(phase)) {
				this.#currentPhase = phase;
				this.#updateDerivedStates();
			}
		}
		
		setWheelSpinning(spinning) { 
			this.#isWheelSpinning = Boolean(spinning); 
		}
		
		setHasPendingGuess(hasGuess) { 
			this.#hasPendingGuess = Boolean(hasGuess); 
		}
		
		#updateDerivedStates() {
			switch(this.#currentPhase) {
				case 'setup':
					this.#isSpinEnabled = false;
					this.#isKeyboardEnabled = false;
					this.#isSolveInputEnabled = false;
					break;
				case 'spinning':
					this.#isSpinEnabled = true;
					this.#isKeyboardEnabled = false;
					this.#isSolveInputEnabled = true;
					break;
				case 'guessing':
					this.#isSpinEnabled = false;
					this.#isKeyboardEnabled = true;
					this.#isSolveInputEnabled = true;
					break;
				case 'solving':
					this.#isSpinEnabled = false;
					this.#isKeyboardEnabled = false;
					this.#isSolveInputEnabled = true;
					break;
				case 'revealed':
					this.#isSpinEnabled = false;
					this.#isKeyboardEnabled = false;
					this.#isSolveInputEnabled = false;
					break;
			}
		}

		canSpin() {
			return this.#isGameLoaded && this.#isSpinEnabled && !this.#isWheelSpinning;
		}
		
		canGuessLetters() {
			return this.#isGameLoaded && this.#isKeyboardEnabled && this.#hasPendingGuess;
		}
		
		canSolve() {
			return this.#isGameLoaded && this.#isSolveInputEnabled;
		}
		
		reset() {
			//this.#isInitialized = false; //@@@surely wrong: will not be reset after initial load???
			this.#isGameLoaded = false;
			this.#isSpinEnabled = false;
			this.#isKeyboardEnabled = false;
			this.#isSolveInputEnabled = false;
			this.#currentPhase = 'setup';
			this.#isWheelSpinning = false;
			this.#hasPendingGuess = false;
		}
	}
	//END OF StateVariables INSERTED CLASS