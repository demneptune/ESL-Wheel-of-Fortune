//@@@BUGFIX: wrong guess at start of game: everything gets blocked
//@@@bugfix: wrong guess before load: enables stuff, guess should not be allowed if game active
//@@@bugfix: double isn't working
//@@@DOUBLE: CHOOSE A CONS, EVEN WHEN ALLOWING VOWELS
//@@@feature: make sure answer uppercase



$(document).ready(function() {

	class NeptuneDesign {
		// ... constructor same as before ...
		
		toast(message, duration = 3000) {
			this._removeExistingToast();
			
			const $toast = $(`<div class="toast">${message}</div>`);
			$toast.css('animation-duration', (duration / 1000) + 's');
			
			$('body').append($toast);
			
			setTimeout(() => $toast.remove(), duration);
		}

		toastGood(message, duration = 3000) {
			this._removeExistingToast();
			
			const $toast = $(`<div class="toast toast-good">😊 ${message}</div>`);
			$toast.css('animation-duration', (duration / 1000) + 's');
			
			$('body').append($toast);
			
			setTimeout(() => $toast.remove(), duration);
		}
		
		toastBad(message, duration = 3000) {
			this._removeExistingToast();
			
			const $toast = $(`<div class="toast toast-bad">😞 ${message}</div>`);
			$toast.css('animation-duration', (duration / 1000) + 's');
			
			$('body').append($toast);
			
			setTimeout(() => $toast.remove(), duration);
		}
		
		_removeExistingToast() {
			$('.toast').remove();
		}
	}

//======================================== GAME SETTINGS ========================================
    class GameSettings {
		#numberOfTeams = 3; //not implemented
        #requireConsonants = true;
		#maxWrongSolves = 0; // 0 = unlimited (not implemented)
        #showLetterCounts = false;
		#vowelCost = 0; //not implemented
		#solveBonusPoints = 1000; //not implemented?
        #wheelSegments = ["100","200","300","400","500","600","700","800","900","BANKRUPT","LOSE TURN","DOUBLE"];
        #defaultPhrase = "TIME";
        //#defaultPhrase = "A STITCH IN TIME SAVES NINE";
        
		
		get numberOfTeams() { return this.#numberOfTeams; } //not implemented
		get solveBonusPoints() { return this.#solveBonusPoints; } //not implemented
		get vowelCost() { return this.#vowelCost; } //not implemented
		get maxWrongSolves() { return this.#maxWrongSolves; } //not implemented
		// ===== SETTERS FOR UNIMPLEMENTED METHODS =====
		setNumberOfTeams(count) { this.#numberOfTeams = Math.max(1, count); } //not implemented
		setSolveBonusPoints(points) { this.#solveBonusPoints = Math.max(0, points); } //@@@not implemented
		setVowelCost(cost) { this.#vowelCost = Math.max(0, cost); } //@@@not implemented
		setMaxWrongSolves(max) { this.#maxWrongSolves = Math.max(0, max); } //@@@not implemented
		
        get requireConsonants() { return this.#requireConsonants; }
        set requireConsonants(value) { this.#requireConsonants = Boolean(value); }
        
        get showLetterCounts() { return this.#showLetterCounts; }
        set showLetterCounts(value) { this.#showLetterCounts = Boolean(value); }
        
        get wheelSegments() { return [...this.#wheelSegments]; }
        set wheelSegments(segments) { 
            if (Array.isArray(segments)) {
                this.#wheelSegments = segments.map(s => s.toString().toUpperCase());
            }
        }

        get defaultPhrase() { return this.#defaultPhrase; }
    }


/*
@@@can add extra dummy states to show entering and leaving a state
Core States:
	'awaiting_first_question' → Page loaded, no problem ready
	'loading_new_question' → @@@proposed state, when clicking any "load" button, can add source of click
	'awaiting_spin' → Wheel stopped, can spin again
	'wheel_spin_start' → Wheel is about to start but not spinning
	'wheel_spinning_now' → Wheel is physically spinning
	'wheel_spin_complete → Wheel has finished spinning, ready for result (special event because DOM is delayed here)
	'awaiting_letter' → Wheel landed, player must guess consonant
	'processing_letter' → Letter entered, processing
	'processing_solve_attempt' → Player can solve or spin again
	'puzzle_revealed' → Puzzle solved/revealed, round over

*/

class StateVariables {
    // ===== STATE TRANSITIONS =====
    #currentState;
	#validStates;
	#validTransitions;
	#forbiddenTransitions;

    #currentTurn; //not implemented: not needed here (not a major transition state)
    #pendingPointsSV = 0; //not implemented
    #pendingMultiplierSV = 1; //not implemented
    #eventSystemSV;

    constructor(eventSystem) {
        this.#eventSystemSV = eventSystem;
		this.#validStates = new Set(
			['awaiting_first_question', 'loading_new_question', 'awaiting_spin', 'wheel_spin_start', 'wheel_spinning_now', 'wheel_spin_complete', 'awaiting_letter', 'processing_letter', 'processing_solve_attempt', 'puzzle_revealed']
		);
		this.#validTransitions = new Map([
			['awaiting_first_question', new Set(['loading_new_question'])], //waiting state
			['loading_new_question', new Set(['awaiting_first_question', 'awaiting_spin'])], //not quite: could be at puzzle_revealed 
																			//so that wouldn't go back to "awaiting_first_question": would not be the ***first*** question
			['awaiting_spin', new Set(['wheel_spin_start', 'processing_solve_attempt'])], //waiting state
			['wheel_spin_start', new Set(['wheel_spinning_now'])],
			['wheel_spinning_now', new Set(['wheel_spin_complete'])],
			['wheel_spin_complete', new Set(['awaiting_letter', 'awaiting_spin'])],
			['awaiting_letter', new Set(['processing_letter', 'processing_solve_attempt'])], //waiting state
			['processing_letter', new Set(['awaiting_spin', 'processing_solve_attempt', 'puzzle_revealed'])],
			['processing_solve_attempt', new Set(['awaiting_spin', 'puzzle_revealed'])],
			['puzzle_revealed', new Set(['loading_new_question'])] //waiting state
		]);
    }

    // ===== DIRECT GETTERS =====
    getCurrentStateDebug() { return this.#currentState; } //special method for debugging; should not be needed for logic

    // ===== DERIVED GETTERS =====
    get isInitialized() { return this.#currentState !== undefined; }
    get canSpin() { return this.#currentState === 'awaiting_spin'; }
    get isWheelSpinningNow() { return this.#currentState === 'wheel_spinning_now'; }
    get canGuessLetters() { return this.#currentState === 'awaiting_letter'; }
    get canSolve() { return ['awaiting_spin', 'awaiting_letter'].includes(this.#currentState); }
		//@@@canSolve() not working properly yet
    get isGameActive() { return !['awaiting_first_question', 'loading_new_question', 'puzzle_revealed'].includes(this.#currentState); }
    get isInputEnabled() { return this.canSolve; }
	
	
	setInitialPageLoadedState() {
		this.#currentState = 'awaiting_first_question';
	}

    // ===== STATE TRANSITION METHOD =====
    changeState(newState, data = {}) {
        const oldState = this.#currentState;

        //Invalid state: exit
        if (!this.#validStates.has(newState)) {
            console.error(`Invalid state: ${newState}`);
            return false;
        }
        // Validate transition (with warnings, not errors - allow flexibility)
        if (!this.#validTransitions.get(oldState)?.has(newState)) { //.get() undefined should be impossible, but still falsy
            console.warn(`Unusual state transition: ${oldState} → ${newState}`);
        }

        // Update state
        this.#currentState = newState;
		console.log(`State: ${oldState} → ${newState}`, data);
        
        // Emit events: state-driven events must only be emitted here, added with: .on(event, callback)
        if (this.#eventSystemSV) {
            this.#eventSystemSV.emit('stateChanged', { //one event with different actions attached, all in UIController atm.
                oldState,
                newState,
                data, //same parameter passed in, included with zero assumptions
            });

            this.#eventSystemSV.emit(`state:${newState}`, { //@@@DIFF EVENT PER STATE, EACH MUST BE ATTACHED
                oldState,
                ...data //elongate and repackage as a new object
            });
        } else {
			console.error("Warning: no #eventSystemSV found");
		}
        return true;
    }

    // ===== OTHER SETTERS =====
	//OOP: can use this class more for eg pending multiplier
}



    // ========== EVENT SYSTEM ==========
	// >50 occurrences of this term "eventSystem"
    class EventSystem {
        #listeners = new Map(); //this will map "event" to a Set
        
        on(event, callback) {
            if (!this.#listeners.has(event)) {
                this.#listeners.set(event, new Set()); //adds to the Map; an event is mapped to a Set of callbacks
            }
            this.#listeners.get(event).add(callback);
        }

		//at this stage, only called once, from WheelManager's spinWM() method
        off(event, callback) {
            if (this.#listeners.has(event)) {
                this.#listeners.get(event).delete(callback);
            }
        }
        
        emit(event, data) {
            if (this.#listeners.has(event)) {
                this.#listeners.get(event).forEach(callback => { //each event maps to a Set of callbacks, parameter: "data"
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in event listener for event: ${event} with data: ${data}:`, error);
                    }
                });
            } else {
				console.warn("this.#listeners does not have event: ", event);
			}
        }
    }

    // ========== TEAM CLASS ==========
    class Team {
        #name;
        #score;
        #color;

        constructor(name, color = '') {
            this.#name = name;
            this.#score = 0;
            this.#color = color;
        }

        get name() { return this.#name; }
        get score() { return this.#score; }
        get color() { return this.#color; }

        addPoints(points) {
            this.#score += points;
            return this.#score;
        }

        resetScore() {
            this.#score = 0;
        }
        
        bankrupt() {
            this.#score = 0;
        }
    }



    // ========== TEAM MANAGER ==========
    class TeamManager {
        #teams = [];
        #currentTurnIndex = 0;
		#currentTeam;
		#pendingPoints = 0;
		#pendingMultiplier = 1;
		#currentPendingState; //NEW: optional marker for state of previous guesses
        #eventSystemTM;
        
        constructor(eventSystem) {
            this.#eventSystemTM = eventSystem;
			/*this.#currentPendingState = {
				pendingPoints: 0,
				pendingMultiplier: 1,
			}*/ //MORE ROBUST METHOD FOR LATER
        }
        
		#getCurrentTeam() { return this.#teams[this.#currentTurnIndex]; } //OOP: new system
        get teams() { return [...this.#teams]; } //OOP: good - only used for renderTeams in UIController
		get currentTurnIndex() { return this.#currentTurnIndex; }
        //get currentTeam() { return this.#teams[this.#currentTurnIndex]; } //OOP: not needed
		get currentTeamName() { return this.#teams[this.#currentTurnIndex].name; } //OOP: replacement to limit surface area
        get pendingPoints() { return this.#pendingPoints; }
        get pendingMultiplier() { return this.#pendingMultiplier; }
		
		//Pending points: set only once; value depends on THE GUESS
        setPendingPoints(points) { this.#pendingPoints = points; }
        setPendingMultiplier(multiplier) { 
			this.#pendingMultiplier = multiplier;
			console.log("Multiplier updated: ", this.#pendingMultiplier);
		}

        initializeTM(teamNames) {
            this.#teams = teamNames.map(name => new Team(name.trim()));
            this.#currentTurnIndex = 0;
            this.#pendingPoints = 0;
            this.setPendingMultiplier(1);
			//@@@several methods with events that are not state-driven, mostly UI updaters
            this.#eventSystemTM.emit('teamsUpdated', this.#teams); //set in UIController and emitted here and in resetAllScores()
            this.#eventSystemTM.emit('turnChanged', this.#getCurrentTeam());
            this.#eventSystemTM.emit('scoreUpdated');
        }
		
		addInstantPointsToCurrentTeam(points) {
			if (!this.#getCurrentTeam()) return 0;
            this.#getCurrentTeam().addPoints(points);

            this.#pendingPoints = 0;
            this.setPendingMultiplier(1);

            this.#eventSystemTM.emit('scoreUpdated');
		}
		

        addPendingPointsToCurrentTeam(letterCount) {
            if (!this.#getCurrentTeam()) return 0;
            
            const points = letterCount * this.#pendingPoints * this.#pendingMultiplier;
			console.log("---BUGFIX: ABOUT TO ADD POINTS, MULTIPLIER: ", points, this.#pendingMultiplier);
            this.#getCurrentTeam().addPoints(points);

			
			//@@@QUICK FIX ONLY: IF "DOUBLE": PENDING WILL BE ZERO; SO DON'T CHANGE MULTIPLIER
			//SHOULD WORK BUT DEPENDS ON PROGRAM LOGIC ELSEWHERE (nextTurn() CLEARS THINGS)
			if (this.#pendingPoints != 0) {
				this.#pendingPoints = 0;
				this.setPendingMultiplier(1);
			}


            this.#eventSystemTM.emit('scoreUpdated'); //updates all scores
            return points;
        }

		nextTurn() {
			if (this.#teams.length === 0) {
				console.warn('No teams initialized');
				return;
			}
			this.#currentTurnIndex = (this.#currentTurnIndex + 1) % this.#teams.length;
			this.#pendingPoints = 0;
			this.setPendingMultiplier(1);
			this.#eventSystemTM.emit('turnChanged', this.#getCurrentTeam()); //turnChanged only updates UI
		}

        bankruptCurrentTeam() {
            if (this.#getCurrentTeam()) {
                this.#getCurrentTeam().bankrupt();
                this.#eventSystemTM.emit('scoreUpdated');
					/*previously had a data parameter*/
            }
        }

        resetAllScores() {
            this.#teams.forEach(team => team.resetScore());
            this.#eventSystemTM.emit('teamsUpdated', this.#teams);
        }
    }

//======================================== PUZZLE MANAGER ========================================
    class PuzzleManager {
        #phrase = '';
        #category = '';
        #guessedLettersPM = new Set();
        #revealedAll = false;
        #eventSystemPM;
        
        constructor(eventSystem) {
            this.#eventSystemPM = eventSystem;
        }
        
        get phrase() { return this.#phrase; }
        get category() { return this.#category; }
        get guessedLettersPM() { return new Set(this.#guessedLettersPM); }
        get isRevealed() { return this.#revealedAll; }
        get isSolved() { //@@@test out with different upper/lowercase situations
            const upperPhrase = this.#phrase.toUpperCase();
            for (const char of upperPhrase) {
                if (/[A-Z]/.test(char) && !this.#guessedLettersPM.has(char)) {
                    return false;
                }
            }
            return true;
        }
        
        setPuzzle({phrase, category = ''}) {
			console.log("puzzle phrase, category: ", phrase, category);
            this.#phrase = phrase;
            this.#category = category;
            this.#guessedLettersPM.clear();
            this.#revealedAll = false;
            this.#eventSystemPM.emit('puzzleUpdated', { phrase: this.#phrase, category: this.#category });
        }
        
		//called once: #handleLetterGuess(letter)
        checkLetterGuessAgainstPhrase(letter) {
            const upperLetter = letter.toUpperCase();
            
            if (!/[A-Z]/.test(upperLetter)) {
                throw new Error('Invalid letter');
            }
            if (this.#guessedLettersPM.has(upperLetter)) {
                return 0; // Letter already guessed
            }
            this.#guessedLettersPM.add(upperLetter);
            
            // Count occurrences
            const upperPhrase = this.#phrase.toUpperCase();
            let count = 0;
            for (const char of upperPhrase) {
                if (char === upperLetter) count++;
            }
            return count;
        }
        
        revealAll() {
            this.#revealedAll = true;
            // Add all letters to guessed set
            const upperPhrase = this.#phrase.toUpperCase();
            for (const char of upperPhrase) {
                if (/[A-Z]/.test(char)) {
                    this.#guessedLettersPM.add(char);
                }
            }
            this.#eventSystemPM.emit('puzzleRevealAllLogicUpdated'); 
        }
        
        getDisplayState() {
            const result = [];
            for (const char of this.#phrase) {
                const upperChar = char.toUpperCase();
                if (!/[A-Z]/.test(upperChar)) {
                    result.push({ type: 'space', char: char });
                } else if (this.#guessedLettersPM.has(upperChar) || this.#revealedAll) {
                    result.push({ type: 'revealed', char: char }); //@@@what does this do: type 'revealed' - what is the program flow?
                } else {
                    result.push({ type: 'hidden', char: '•' });
                }
            }
            return result;
        }
		
		//@@@not called
        //reset PuzzleManager
        reset() {
            this.#guessedLettersPM.clear();
            this.#revealedAll = false;
        }
    }

//======================================== WHEEL MANAGER ========================================
    class WheelManager {
        #segments = [];
        #rotation = 0;
        #svgElement = null;
        #segAngles = [];
        #eventSystemWM;
		#stateVariablesWM; //needed because wheel stopping is a special state
        
        constructor({eventSystem, stateVariables}) { 
            this.#eventSystemWM = eventSystem;
			this.#stateVariablesWM = stateVariables;
        }
		
		//public methods possibly can be named after states (or possibly state changes), eg. initializeWM(gameSettings)

        get segments() { return [...this.#segments]; }
        
        initializeWM(segments, svgElement) {
            this.#segments = segments.map(s => s.toString().toUpperCase());
            this.#svgElement = svgElement;
            this.#rotation = 0;
            this.draw();
        }
        
        draw() {
            if (!this.#svgElement) return;
            
            this.#svgElement.empty();
            const n = this.#segments.length;
            const angle = 360 / n;
            this.#segAngles = [];
            
            const R = 200;
            const cx = 0, cy = 0;
            
            const polar = (r, a) => {
                const rad = (a - 90) * Math.PI / 180;
                return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
            };
            
            // Create segments
            for (let i = 0; i < n; i++) {
                const start = i * angle - angle / 2;
                const end = start + angle;
                this.#segAngles.push({ start, end });
                
                const [x1, y1] = polar(R, start);
                const [x2, y2] = polar(R, end);
                const largeArc = angle > 180 ? 1 : 0;
                const path = `M 0 0 L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
                
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                const wedge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                wedge.setAttribute('d', path);
                
                const hue = (i * 360 / n);
                const c1 = `hsl(${(hue + 12) % 360} 80% 54%)`;
                const c2 = `hsl(${(hue + 12) % 360} 80% 42%)`;
                wedge.setAttribute('fill', `url(#grad${i})`);
                wedge.setAttribute('stroke', '#0c1428');
                wedge.setAttribute('stroke-width', '1');
                
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                grad.setAttribute('id', `grad${i}`);
                grad.setAttribute('x1', '0%'); grad.setAttribute('x2', '0%');
                grad.setAttribute('y1', '0%'); grad.setAttribute('y2', '100%');
                
                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', c1);
                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', c2);
                
                grad.appendChild(stop1); grad.appendChild(stop2); defs.appendChild(grad);
                
                const mid = start + angle / 2;
                

				/*
				// OLD: Single horizontal text
				const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('font-size', '18');
                label.setAttribute('font-weight', '800');
                label.setAttribute('fill', '#08111f');
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('dominant-baseline', 'middle');
                
                const [tx, ty] = polar(R * 0.8, mid);
                label.setAttribute('x', tx.toFixed(2));
                label.setAttribute('y', ty.toFixed(2));
                
                let rot = mid;
                //if (rot > 90 && rot < 270) { rot += 180; } //this was causing the silly pseudo-rotations
                label.setAttribute('transform', `rotate(${rot.toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})`);
                label.textContent = this.#segments[i];
				g.appendChild(defs);
                g.appendChild(wedge);
                g.appendChild(label);
				*/
				// NEW: Vertical text with individual letters
				const text = this.#segments[i].toString();
				const textLength = text.length;

				// Adaptive sizing based on text length
				let fontSize, letterSpacing, radiusMultiplier;

				if (textLength <= 3) {
					// Numbers and short words (100, 500, etc.)
					fontSize = 25;
					letterSpacing = 22;
					radiusMultiplier = 0.77; // Closer to center for short text
				} else if (textLength <= 6) {
					// Medium words (BANKRUPT, DOUBLE)
					fontSize = 20;
					letterSpacing = 18;
					radiusMultiplier = 0.67; // Further out for medium text
				} else {
					// Long words (LOSE TURN - though it should be split)
					fontSize = 18;
					letterSpacing = 15;
					radiusMultiplier = 0.64; // Furthest out for long text
				}

				const [tx,ty] = polar(R * radiusMultiplier, mid);

				let rot = mid;
				//if(rot > 180) { rot -= 180; }

				const labelGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
				labelGroup.setAttribute('transform', `rotate(${rot.toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})`);

				for(let j = 0; j < textLength; j++) {
					const letter = document.createElementNS('http://www.w3.org/2000/svg','text');
					letter.setAttribute('font-size', fontSize.toString());
					letter.setAttribute('font-weight','800');
					letter.setAttribute('fill','#08111f');
					letter.setAttribute('text-anchor','middle');
					letter.setAttribute('dominant-baseline','middle');
					letter.setAttribute('x', tx.toFixed(2));
					letter.setAttribute('y', (ty + (j - (textLength-1)/2) * letterSpacing).toFixed(2));
					letter.textContent = text[j];
					labelGroup.appendChild(letter);
				}

				g.appendChild(defs);
				g.appendChild(wedge);
				g.appendChild(labelGroup);
				//END OF NEW CODE
				
                

                this.#svgElement[0].appendChild(g);
            }
            
            // Add rim and hub
            const rim = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            rim.setAttribute('cx', '0'); rim.setAttribute('cy', '0'); rim.setAttribute('r', '205');
            rim.setAttribute('fill', 'none'); rim.setAttribute('stroke', '#0c1428'); rim.setAttribute('stroke-width', '8');
            
            const hubOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hubOuter.setAttribute('cx', '0'); hubOuter.setAttribute('cy', '0'); hubOuter.setAttribute('r', '34');
            hubOuter.setAttribute('fill', '#0a1223'); hubOuter.setAttribute('stroke', '#20304b'); hubOuter.setAttribute('stroke-width', '3');
            
            const hubInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hubInner.setAttribute('cx', '0'); hubInner.setAttribute('cy', '0'); hubInner.setAttribute('r', '8');
            hubInner.setAttribute('fill', '#22314a');
            
            this.#svgElement[0].appendChild(rim);
            this.#svgElement[0].appendChild(hubOuter);
            this.#svgElement[0].appendChild(hubInner);
            
            this.#svgElement.css('transition', 'transform 0s');
            this.#svgElement.css('transform', `rotate(${this.#rotation}deg)`);
        }

        spinWM() {
            if (!this.#svgElement) return;

            const extra = Math.random() * 360;
            const full = (3 + Math.random() * 4) * 360;
            const delta = full + extra;
            this.#rotation = (this.#rotation + delta) % (360 * 99999);

            const dur = 2.8 + Math.random() * 1.2;
            this.#svgElement.css('transition', `transform ${dur.toFixed(2)}s cubic-bezier(.17,.84,.26,1)`);

            requestAnimationFrame(() => {
                this.#svgElement.css('transform', `rotate(${this.#rotation}deg)`);
            });

			//ensure wheel has stopped spinning before reading result (otherwise execution is ahead of DOM)
            const onEnd = () => {
                this.#svgElement.off('transitionend', onEnd);
                const result = this.#getCurrentSegment();
				console.log("wheel spin: result, ie. getCurrentSegment(), = ", result);
				this.#stateVariablesWM.changeState('wheel_spin_complete', result); //must be done here in WM
													//@@@WHY CAN WE SEND "RESULT" AS A PARAMETER, SURELY NEEDS {} OBJECT SYNTAX??
            };

            this.#svgElement.on('transitionend', onEnd); //fundamental svg event, must be called here
			return;
        }
        
        #getCurrentSegment() {
            const n = this.#segments.length;
            const angle = 360 / n;
            const eff = ((360 - (this.#rotation % 360)) + angle / 2) % 360;
            const idx = Math.floor(eff / angle);
            const clampedIdx = Math.min(Math.max(idx, 0), n - 1);
            return {
                value: this.#segments[clampedIdx],
                index: clampedIdx
            };
        }
		
		//@@@not called
        //reset WheelManager
        reset() { //@@@ensure this has the correct state
            this.#rotation = 0;
            if (this.#svgElement) {
                this.#svgElement.css('transition', 'transform 0s');
                this.#svgElement.css('transform', 'rotate(0deg)');
            }
        }
    }

//======================================== KEYBOARD MANAGER ========================================
    class KeyboardManager {
        #element = null;
        #allowVowels = false;
        #guessedLettersKM = new Set();
        //#eventSystemKM; //@@@used once for letter selected: get rid of this, not needed
		#stateVariablesKM;
        
        constructor({eventSystem, stateVariables}) {
            //this.#eventSystemKM = eventSystem;
			this.#stateVariablesKM = stateVariables;
        }
        
        initializeKM(element) {
            this.#element = element;
            this.#createKeys();
            this.#disableKB();
        }

		//other public methods should be named after states (or possibly state changes), eg. processGuessKM(letter)

        #createKeys() {
            if (!this.#element) return;
            
            this.#element.empty();
            const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

            LETTERS.forEach(letter => {
                const key = $(`<button class="key">${letter}</button>`);
                key.prop('disabled', true);
                key.on('click', () => {
					this.#stateVariablesKM.changeState('processing_letter', {letter});
                });
                this.#element.append(key);
            });
        }

        enableKB(allowVowels = false) {
            this.#allowVowels = allowVowels;
            this.#updateKeyStates();
        }

        #disableKB() { //can we make this private?? make the public call a state change
            if (this.#element) {
                this.#element.find('.key').prop('disabled', true);
            }
        }

        updateGuessedLettersKM(guessedLetters) {
            this.#guessedLettersKM = new Set(guessedLetters);
            this.#updateKeyStates();
        }
        
        #updateKeyStates() { //updates every key acc to: canGuessLetters/guessedLetters/allowVowels
            if (!this.#element) return;
            
            this.#element.find('.key').each((index, element) => {
                const $key = $(element);
                const letter = $key.text();
                const isVowel = /[AEIOU]/.test(letter);
                
                const isDisabled = !this.#stateVariablesKM.canGuessLetters || 
                                 this.#guessedLettersKM.has(letter) || 
                                 (!this.#allowVowels && isVowel);
                $key.prop('disabled', isDisabled);
            });
        }
		
		//called once at start of round
        //reset KeyboardManager
        reset() {
            this.#guessedLettersKM.clear();
            this.#disableKB();
        }
    }

//======================================== GAME ENGINE ========================================
    class GameEngine {

		#eventSystemGE = new EventSystem();
		#settings = new GameSettings();
		#teamManager;
		#puzzleManager;
		#wheelManager;
		#keyboardManager;
		#stateVariablesGE; //REPLACES #gameState
        
        constructor() {
            this.#teamManager = new TeamManager(this.#eventSystemGE);
            this.#puzzleManager = new PuzzleManager(this.#eventSystemGE);
            this.#setupEventListenersGE();
			this.#stateVariablesGE = new StateVariables(this.#eventSystemGE);
        }
        
		//getters are typically called by UIController
        get settings() { return this.#settings; }
		get eventSystem() { return this.#eventSystemGE; }
		get teamManager() { return this.#teamManager; }
		get puzzleManager() { return this.#puzzleManager; }
		//get wheelManager() { return this.#wheelManager; } //not called, shouldn't be needed
		get keyboardManager() { return this.#keyboardManager; }
		get settings() { return this.#settings; }
        get stateVariables() { return this.#stateVariablesGE; }

        initializeOnPageLoadGE() {
            if (this.#stateVariablesGE.isInitialized ) return;
            this.#wheelManager = new WheelManager({eventSystem: this.#eventSystemGE, stateVariables: this.#stateVariablesGE});
			this.#keyboardManager = new KeyboardManager({eventSystem: this.#eventSystemGE, stateVariables: this.#stateVariablesGE});
            // Initialize components with DOM elements
            this.#wheelManager.initializeWM(
                this.#settings.wheelSegments,
                $('#wheel')
            );
            
            this.#keyboardManager.initializeKM($('#keyboard'));
            
            // Set up initial puzzle
			//@@@@@*******DELETE THIS, THERE IS NO PUZZLE
            //this.#puzzleManager.setPuzzle({
                //phrase: this.#settings.defaultPhrase,
                //category: 'proverb',
            //});
        }

        #setupEventListenersGE() {
			this.#eventSystemGE.on('state:awaiting_first_question', (data) => {
				console.log("awaiting_first_question: ", data.source);
			});
			this.#eventSystemGE.on('state:loading_new_question', (data) => {
				this.#startRound({
					phrase: data.phrase,
					category: data.category,
					teamNames: data.teamNames,
					wheelSegments: data.wheelSegments,
				});
				this.#stateVariablesGE.changeState('awaiting_spin', {source: 'loading_new_question'}); //@@@@must check load complete: startRound must return true/false
			});

			this.#eventSystemGE.on('state:awaiting_spin', (data) => {
				console.log("initialising: source: ", data.source);
				//@@@@@handle activation of wheel button, deactivation of keyboard here????
			});
			
			this.#eventSystemGE.on('state:wheel_spin_start', () => {
				this.#stateVariablesGE.changeState('wheel_spinning_now');
			});
			this.#eventSystemGE.on('state:wheel_spinning_now', () => {
				this.#wheelManager.spinWM();
			});
			
			//@@@this needs more care: follow state changes
            this.#eventSystemGE.on('state:wheel_spin_complete', (result) => { //special event triggered when wheel actually stops
                const isSuccessfulSpin = this.#handleWheelResult(result); 
				const newState = isSuccessfulSpin ? 'awaiting_letter' : 'awaiting_spin';
				this.#stateVariablesGE.changeState(newState, {source: 'wheel_spin_complete'}); //awaiting_letter or awaiting_spin
            });

			this.#eventSystemGE.on('state:awaiting_letter', () => {
				const allowVowels = !this.#settings.requireConsonants;
				this.#keyboardManager.enableKB(allowVowels); 
					//activates keyboard -> allows event listener
						//event listener attached in KM, which uses the event 'processing_letter'
			});
            // Keyboard events
            this.#eventSystemGE.on('state:processing_letter', (result) => { //parameter is an object
                let returnObj = this.#handleLetterGuess(result.letter);
				if (returnObj.isSolved) {
					this.#stateVariablesGE.changeState('puzzle_revealed', {source: 'processing_letter'});
					
				} else {
					this.#stateVariablesGE.changeState('awaiting_spin', {source: 'processing_letter'});
				}
				this.#eventSystemGE.emit('letterGuessLogicUpdated'); //UI updater: renderPuzzle only
            });

			//@@@event must not be called if state not compatible
			this.#eventSystemGE.on('state:processing_solve_attempt', (data) => {
				const guess = data.guess;
				const result = this.#processDirectAttemptSolvePuzzle(guess); //only returns true/false, minimal other response
				if (result) {
					this.#stateVariablesGE.changeState('puzzle_revealed', {source: 'processing_solve_attempt'});
				} else {
					this.#stateVariablesGE.changeState('awaiting_spin', {source: 'state:processing_solve_attempt -> wrong guess'});
					this.#teamManager.nextTurn(); //@@@must check the state: should be awaiting_spin
				}
				
			});

			this.#eventSystemGE.on('state:puzzle_revealed', (data) => {
				if (data.source == 'processing_letter' || data.source == 'processing_solve_attempt') {
					this.#handlePuzzleCorrectlySolved(); //update scores and UI incl confetti
				}
				if (data.source == '#revealBtn') {
					this.#eventSystemGE.emit('ui_puzzleRevealedByGivingUp');
				}
				//if (data?.source == came from direct solution or from last letter: handle correct; came from give up: handle otherwise)
				this.#puzzleManager.revealAll();
				
			});
        }

		//post-condition: will return the state change parameter, and will change the team if needed
        #handleWheelResult(result) {
            const value = result.value;

            if (/BANKRUPT/i.test(value)) {
                this.#teamManager.bankruptCurrentTeam();
                this.#teamManager.nextTurn();
                this.#eventSystemGE.emit('gameMessage', 'Bankrupt! Next team.');
                return (false);
            }

            if (/LOSE\s*TURN/i.test(value)) {
                this.#teamManager.nextTurn();
                this.#eventSystemGE.emit('gameMessage', 'Lose your turn! Next team.');
                return (false);
            }

            if (/DOUBLE/i.test(value)) {
                this.#teamManager.setPendingMultiplier(2);
                this.#eventSystemGE.emit('gameMessage', 'DOUBLE! Choose a consonant.');
                return (true);
            }

            const points = parseInt(value, 10);
            if (Number.isFinite(points)) {
                this.#teamManager.setPendingPoints(points);
                this.#eventSystemGE.emit('gameMessage', 
                    `Landed on ${points}. Choose a ${this.#settings.requireConsonants ? 'consonant' : 'letter'}.`);
                return (true);
            }

            this.#teamManager.nextTurn(); //fallback code: should not reach here
			return (false);
        }

		//precondition: currentState: should be 'awaiting_letter' - console check
		//state-driven: state:processing_letter calls this, it in turn calls checkLetterGuessAgainstPhrase in PuzzleManager
        #handleLetterGuess(letter) {
            const count = this.#puzzleManager.checkLetterGuessAgainstPhrase(letter); //count: how many occurrences
            this.#keyboardManager.updateGuessedLettersKM(this.#puzzleManager.guessedLettersPM);

            if (count > 0) { 
                const points = this.#teamManager.addPendingPointsToCurrentTeam(count); 
                if (this.#settings.showLetterCounts) {
                    this.#eventSystemGE.emit('gameMessage', 
                        `${letter} × ${count}${points ? ` → +${points}` : ''}. Spin again or solve.`);
                } else {
                    this.#eventSystemGE.emit('gameMessage', 
                        `${count > 1 ? 'Nice!' : 'Good!'} Spin again or solve.`);
                }
            } else {
                this.#teamManager.nextTurn(); //@@@what makes state change??
				this.#eventSystemGE.emit('gameMessage', `${letter}: No matches. Next team.`);
            }

			const returnObj = {
				isSolved: this.#puzzleManager.isSolved
			};
			return returnObj;
        }

        #handlePuzzleCorrectlySolved() {
            this.#teamManager.setPendingPoints(0); // Reset pending points
            this.#teamManager.addInstantPointsToCurrentTeam(1000); 
            this.#eventSystemGE.emit('gameMessage', 
                `${this.#teamManager.currentTeamName} solved it! +1000 bonus.`);
            this.#eventSystemGE.emit('confettiBurst');
        }

		//@@@should return true/false: false = fails some validity check
        #startRound({phrase, category, teamNames, wheelSegments}) {
            // Update settings
            if (wheelSegments) {
                this.#settings.wheelSegments = wheelSegments;
            }
			
			console.log("team names are: ", teamNames);

            // Initialize teams
            this.#teamManager.initializeTM(teamNames);

            //@@@PUZZLE SETUP: ADD OTHER DATA HERE, EG HINTS
            this.#puzzleManager.setPuzzle({phrase, category}); //category is set by the host

            // Reset wheel
            this.#wheelManager.initializeWM(
                this.#settings.wheelSegments,
                $('#wheel')
            );

            // Reset keyboard
            this.#keyboardManager.reset();
            this.#keyboardManager.updateGuessedLettersKM(this.#puzzleManager.guessedLettersPM);
            this.#eventSystemGE.emit('gameMessage',
                `${this.#teamManager.currentTeamName}, start us off — spin the wheel!`);
        }

		//called by state change in GE only
		//pre: attempted solution; post: only handles true/false, minimal output
        #processDirectAttemptSolvePuzzle(guess) {
            const normalizedGuess = guess.trim().toUpperCase().replace(/\s+/g, ' ');
            const normalizedPhrase = this.#puzzleManager.phrase.trim().toUpperCase().replace(/\s+/g, ' ');
            if (normalizedGuess === normalizedPhrase) {
                return true;
            } else {
                this.#eventSystemGE.emit('gameMessage', 'Not quite — next team.');
                return false;
            }
        }

        clearScores() {
            this.#teamManager.resetAllScores();
            this.#eventSystemGE.emit('gameMessage', 'Scores cleared.');
        }
    }

//======================================== UI CONTROLLER ========================================
    class UIController {
        #gameEngine;
        #eventSystemUI;
		#stateVariablesUI;

        constructor(gameEngine) {
            this.#gameEngine = gameEngine;
            this.#eventSystemUI = gameEngine.eventSystem;
			this.#stateVariablesUI = gameEngine.stateVariables;
        }
        
        initializeUI() {
            this.#setupEventListenersUI();
            this.#setupButtonHandlers();
            this.#updateInitialDisplay();
			this.#stateVariablesUI.setInitialPageLoadedState();
			this.#gameEngine.settings.requireConsonants = $('#requireConsonant').is(':checked');
        }

        #setupEventListenersUI() {
			console.log("setting up event listeners");
            this.#eventSystemUI.on('gameMessage', (message) => {
                $('#turnHint').text(message);
            });

            this.#eventSystemUI.on('puzzleUpdated', (data) => {
                $('#categoryOut').text(data.category || '(none)');
                this.#renderPuzzle();
            });

            this.#eventSystemUI.on('teamsUpdated', (teams) => {
                this.#renderTeams(teams);
            });

            this.#eventSystemUI.on('turnChanged', (team) => { 
                this.#renderTeams(this.#gameEngine.teamManager.teams);

				if (!team) {
					console.warn('No team defined for turn');
					return;
				}
				this.#eventSystemUI.emit('gameMessage', 
					`${team.name}, your turn — spin the wheel!`); //@@@never appears: gets wiped it seems
				console.log('gameMessage', 
					`${team.name}, your turn — spin the wheel!`);

            });

            this.#eventSystemUI.on('scoreUpdated', () => { //previously passed a data parameter: method simply updates all scores
                this.#renderTeams(this.#gameEngine.teamManager.teams);
            });

            this.#eventSystemUI.on('letterGuessLogicUpdated', () => { //emitted by state-driven change in GameEngine
                this.#renderPuzzle();
            });
			
			//emitted under PuzzleManager.revealAll() which is called whenever the puzzle is solved to ensure full reveal
            this.#eventSystemUI.on('puzzleRevealAllLogicUpdated', () => {
                this.#renderPuzzle();
            });
            
            this.#eventSystemUI.on('confettiBurst', () => {
                this.#triggerConfetti();
            });
			
			this.#eventSystemUI.on('ui_puzzleRevealedByGivingUp', () => {
				this.#eventSystemUI.emit('gameMessage', 'Puzzle revealed. You can start a new round.'); 
			});


			
			this.#eventSystemUI.on('stateChanged', () => {
				const state = this.#gameEngine.stateVariables;
				$('#spinBtn').prop('disabled', !state.canSpin);
				$('.key').prop('disabled', !state.canGuessLetters);
				$('#solveInput').prop('disabled', !state.canSolve);
				//@@@canSolve not working
			});
        }

        #setupButtonHandlers() {
			//@@@Start button: needs state-driven?
            $('#startBtn').on('click', () => {
                const phrase = $('#hostPhrase').val().trim() || this.#gameEngine.settings.defaultPhrase;
                const category = $('#hostCategory').val().trim();
                const teamNames = $('#hostTeams').val().trim().split(',').filter(name => name.trim());
                const wheelSegments = $('#hostSegments').val().trim().split(',').filter(seg => seg.trim());
				this.#stateVariablesUI.changeState('loading_new_question', 
					{source: 'UI: setupButtonHandlers', phrase, category, teamNames, wheelSegments});
            });

            // Spin button
            $('#spinBtn').on('click', () => {
				this.#stateVariablesUI.changeState('wheel_spin_start');
            });
			// Keyboard listeners: see KeyboardManager class

            // Clear scores button
            $('#clearScoresBtn').on('click', () => {
                this.#gameEngine.clearScores();
            });

            // Solve buttons
            $('#solveBtn').on('click', () => {
                $('#solveInput').focus();
            });

            $('#checkSolveBtn').on('click', () => {
				const guess = $('#solveInput').val();
				this.#stateVariablesUI.changeState('processing_solve_attempt', {guess});
            });

            $('#solveInput').on('keydown', (e) => {
                if (e.key === 'Enter') {
                    const guess = $('#solveInput').val();
                    this.#stateVariablesUI.changeState('processing_solve_attempt', {guess});
                }
            });
			
			// Reveal button (for giving up)
            $('#revealBtn').on('click', () => {
				this.#stateVariablesUI.changeState('puzzle_revealed', {source: '#revealBtn'});
            });

            // Settings toggle
            $('#hideSettingsBtn').on('click', () => {
                $('#hostControls').toggle();
                const isVisible = $('#hostControls').is(':visible');
                $('#hideSettingsBtn').text(isVisible ? 'Hide Settings' : 'Show Settings');
            });

            // Settings checkboxes
            $('#requireConsonant').on('change', (e) => {
                this.#gameEngine.settings.requireConsonants = e.target.checked;
            });

            $('#showLetterCounts').on('change', (e) => {
                this.#gameEngine.settings.showLetterCounts = e.target.checked;
            });
        }

        #renderPuzzle() {
            const $puzzle = $('#puzzle');
            $puzzle.empty();

            const displayState = this.#gameEngine.puzzleManager.getDisplayState();

            // Group by words
            let currentWord = $('<div class="word-group"></div>');

            displayState.forEach((charState, index) => {
                if (charState.type === 'space') {
                    // Add the current word and start a new one
                    if (currentWord.children().length > 0) {
                        $puzzle.append(currentWord);
                    }
                    // Add space
                    $puzzle.append($('<div class="tile space">&nbsp;</div>'));
                    currentWord = $('<div class="word-group"></div>');
                } else {
                    const tile = $(`<div class="tile ${charState.type}">${charState.char}</div>`);
                    currentWord.append(tile);
                }
            });

            // Add the last word if it exists
            if (currentWord.children().length > 0) {
                $puzzle.append(currentWord);
            }
        }

        #renderTeams(teams) {
            const $teamsEl = $('#teams');
            $teamsEl.empty();

            teams.forEach((team, index) => {
                const isActive = index === this.#gameEngine.teamManager.currentTurnIndex;
				console.log("currentTurnIndex", this.#gameEngine.teamManager.currentTurnIndex);
                const badge = $(`<div class="badge ${isActive ? 'active' : ''}">${team.name}: ${team.score}</div>`);
                $teamsEl.append(badge);
            });
        }
        
        #triggerConfetti() {
            const confetti = document.getElementById('confetti'); //@@@make jquery
            const ctx = confetti.getContext('2d');
            const w = confetti.width = window.innerWidth;
            const h = confetti.height = window.innerHeight;
            
            const pieces = Array.from({length: 120}, () => ({
                x: Math.random() * w,
                y: -10,
                r: 2 + Math.random() * 3,
                vx: -2 + Math.random() * 4,
                vy: 2 + Math.random() * 3,
                a: Math.random() * Math.PI * 2
            }));
            
            let t = 0;
            const tick = () => {
                ctx.clearRect(0, 0, w, h);
                for (const p of pieces) {
                    p.x += p.vx; p.y += p.vy; p.a += .1;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.a);
                    ctx.fillStyle = `hsl(${(p.x + p.y) % 360} 90% 60%)`;
                    ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
                    ctx.restore();
                }
                t++;
                if (t < 90) requestAnimationFrame(tick);
            };
            tick();
        }
        #updateInitialDisplay() {
            // Set initial values in form
            $('#hostPhrase').val(this.#gameEngine.settings.defaultPhrase);
            $('#hostTeams').val('Red, Blue, Green');
            $('#hostSegments').val(this.#gameEngine.settings.wheelSegments.join(','));
            
            // Disable spin button initially
            $('#spinBtn').prop('disabled', true);
        }
    }

    // ========== INITIALIZATION ==========
	// Create global instance like Materialize's M
	const N = new NeptuneDesign();
	// Normal toast
	//N.toast("Game Started!", 2000);

	// Good toast with smiley
	N.toastGood("Correct! +100 points");

	// Bad toast with frowny  
	N.toastBad("Bankrupt! Lost all points");

	// Custom duration
	//N.toast("Team Blue's turn", 5000);
	
    try {
        const gameEngine = new GameEngine();
        const uiController = new UIController(gameEngine);
        
        // Make gameEngine accessible for debugging
        window.gameEngine = gameEngine;
        
        gameEngine.initializeOnPageLoadGE();
        uiController.initializeUI();
        
        console.log('ESL Wheel of Fortune initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        $('#turnHint').text('Error initializing game. Please refresh the page.');
    }
});





