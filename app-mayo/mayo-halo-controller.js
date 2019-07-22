
/*
 * Birthdate is expected in format YYYY-MM-DD
 * Height: cm
 * Weight: kg
 * Gender: 'male' or 'female'
 */
function User(b, h, w, g) {
	this.age = Math.floor(Math.abs(new Date() - new Date(b)) / 31556952000)
	this.height = h;
	this.weight = w;
	this.gender = g;
  this.heartAverageMaximum = Math.max(150, 200 - (this.age - 20));
  this.heartTarget = this.heartAverageMaximum / 2;
}

function MetricInterval() {

	this.deviceOn = false; // Have we received ANY data for this metric interval?
	this.label    = null;  // String representation of this metric interval

	this.kcal    = 0;   // Currently not used to compute anything
	this.met     = 0;   // Currently not used to compute anything
	this.dist    = 0;   // Distance walking/running
	this.cdist   = 0;   // Distance cycling
	this.flights = 0;   // Flights climbed
	this.stood   = 0;   // Have they stood this hour? -- also currently not used to compute anything
	this.heart   = '-'; // Current heart rate for interval, if any. '-' = not available.
	this.havg    = '-'; // Average heart rate for interval, if any. '-' = not available.
	this.hpeak   = 0;   // Peak heart rate for the interval
	this.steps   = 0;   // Steps taken.
	this.exmin   = 0;   // Minutes exercised

	this.htot    = 0;   // Used to compute heart average
	this.hcount  = 0;   // Used to compute heart average

}

function View() {

	// All the data that drives the halo engine.
  this.halo = {

    // Dynamic Data -- No confusing defaults!
    complexity:       0.0,
    wobble:           0.0,
    color:            0.0,
    speed:            0.0,
    brightness:       0.0,
    size:             0.0,
    waveCount:        0,
    colorCenter:      0.01,
    colorCenterRatio: 0.01,
    highlightRing:    0.75,
    waveIntensity:    0.0,

    // Application configuration.
    solidLines:        true,
    showGrid:          true,
    minRingRadius:   0.6,
    showGrid:          false,
    minNumRings:    10,
    maxNumRings:    80,
    minRingRadius:   0.35,
    maxRingRadius:   1,
    showAuraAtRing: -1,
    auraOpacity:     1,
    waveSpeed:       0.5,
    waveColor:       0.2,
    evenLineDistribution: true,
    background:           '000000',
	  fullScreen: true
  };

  this.radiant   = true;
  this.haloReady = false;

  this.render = function() {
    // On first display, prime halo with data on initialization to prevent
    // race condition with hard-coded defaults.

    if (!this.haloReady) {
      HaloInitialize({
        width: 720,
        height: 720,
        initialState: this.halo,
        fullScreen: this.halo.fullScreen,
        arcball: false
      });
      this.haloReady = true;
    }

    HaloSetMode('present');
    HaloSetGlobalParams(this.halo);

  };
}

function ViewState() {

	/* Unadjusted ratios used for complexity/speed */
  this.currentHeartRate       = 0;
  this.lastKnownHeartRate     = 0;
  this.currHeartRatio         = 0.0;
  this.heartRest              = 'N/A';
  this.peakHeartRate          = 'N/A';
  this.highHeartAverage       = 0.0;

  /* Adjusted ratios used for color */
  this.currAdjustedHeartRatio = 0.0;
  this.highAdjustedHeartAverageRatio = 0.0;
  this.allAdjustedHeartRatios = [];
  this.peakAdjustedHeartRatio = 0.0;
  this.exerciseIntervals      = 0;
  this.exerciseMin            = 0;

  this.heartAverageMaximum    = 0;
  this.heartTarget            = 0;

  this.activity    = 0;
  this.totalSteps  = 0;
  this.currSteps   = 0;
  this.stepDelta   = 0;
  this.hoursStood  = 0;

  this.timeIndex   = 0;

  /*wobbly animation when there is no data*/
  this.noDataMode = false;

  this.findLatestRecord = function(model) {
  	for (var i = model.length - 1; i--; i >= 0) {
  		if (model[i].deviceOn) {
  			this.timeIndex = i;
  			return this.timeIndex;
  		}
  	}
  }

  this.recompute = function(user, model, idx) {

  	if (!idx) {
  		idx = this.findLatestRecord(model);
  	}

    // Heart Range
    this.heartAverageMaximum = Math.max(150, 200 - (user.age - 20));
    this.heartTarget = this.heartAverageMaximum / 2;
    this.allAdjustedHeartRatios = [];

    // Compute Totals:
    var steps      = 0;
    var priorSteps = 0;
    var currSteps  = 0;
    var thisHour   = false;
    var hTarget    = this.heartTarget;
    var hMinimum   = this.heartAverageMaximum / 4;
    var hRatio     = 0.0;
    var adjHRatio  = 0.0;
    var hPeak      = 0;
    var hRest      = null;
    var heart      = 0;
    var activity   = 0;
    var hRestArr   = [];
    var highHTot   = 0;
    var highHCount = 0;
    var lowHTot    = 0;
    var lowHCount  = 0;
    var exMin      = 0;
    var stepLen    = user.gender == 'female' ? (0.413 * user.height) : (0.415 * user.height);

    for (var i = 0; i <= idx; i++) {

      // Steps
      priorSteps = currSteps;
      currSteps  = model[i].steps;
      steps += currSteps;
      this.stepDelta = currSteps - priorSteps;

      // Standing - we don't actually rely on device stood hour for this. seems unreliable.
      if (currSteps > 0) {
        thisHour = 6;
      } else {
        thisHour--;
      }

      if (thisHour > 0) {
        this.hoursStood = 1.0;
      } else {
        this.hoursStood = 0.0001;
      }

      if (!model[i].deviceOn) {
      	continue;
      }

      //  cycling distance as steps
      var cycSteps = model[i].cdist / 1000 * 0.339;
      if (cycSteps > 0) {
        currSteps += cycSteps / stepLen;
      }
      // Cumulative Activity: steps + distance + stationary exercise // But there is no HK for stationary?
      activity += currSteps;

      // Heart Calculations
      heart  = model[i].heart;
      adjHRatio = 0.0001;
      if (heart != '-') {
        if (heart > this.heartAverageMaximum) {
          heart = this.heartAverageMaximum;
        }
        if (heart < hMinimum) {
          heart = hMinimum;
        }
        if (heart < hTarget) {
        	lowHCount++;
        	lowHTot += heart;
        }
        if (model[i].exmin > 0) {
        	exMin += model[i].exmin;
          highHCount++;
          highHTot += heart;
        } else {
        	hRestArr.push(heart);
        }
        this.lastKnownHeartRate = heart;
        hRatio = heart / this.heartAverageMaximum;
        adjHRatio = (heart - hMinimum) / (this.heartAverageMaximum - hMinimum);

        // Multiply activity entries to emphasize in stratified view
        for (var n = 0; n < currSteps; n += 50) {
          this.allAdjustedHeartRatios.push(adjHRatio);
        }
      } else if (model[i].deviceOn > 0) {
        this.allAdjustedHeartRatios.push(0.01);
      }

      if (model[i].hpeak > hPeak) {
      	hPeak = model[i].hpeak;
      }

    }

    // Minimum non-exercise heart rate in the past hour.
    if (hRestArr.length > 0) {
    	for (i = hRestArr.length - 1; i >= hRestArr.length - 7; i--) {
    		if (hRest === null || hRestArr[i] < hRest) {
    			hRest = hRestArr[i];
    		}
    	}
    }
		if (hRest !== null) {
		    this.heartRest = hRest;
		} else {
			this.heartRest = 'N/A';
		}

    this.totalSteps        = steps;
    this.activity          = activity;
    this.currentSteps      = currSteps;
    this.currentHeartRate  = heart;
    this.currHeartRatio    = hRatio;
    this.peakHeartRate     = hPeak;
    this.highHeartAverage  = Math.round(highHTot / highHCount);
    this.exerciseMin       = exMin;

    var lowHAvg            = lowHTot / lowHCount;

    this.lowAdjustedHeartAverageRatio = (lowHAvg - hMinimum) / (this.heartAverageMaximum - hMinimum);
    this.highAdjustedHeartRatio = (this.highHeartAverage - hMinimum) / (this.heartAverageMaximum - hMinimum);
    this.peakAdjustedHeartRatio = (hPeak - hMinimum) / (this.heartAverageMaximum - hMinimum);
    this.currAdjustedHeartRatio = adjHRatio;

    this.noDataMode = this.totalSteps < 20;
  }

  this.normalizeComplexity = function(v) {
		if (v.radiant == true) {
			if (this.currHeartRatio > 0.0) {
				v.halo.complexity = this.currHeartRatio;
			} else {
				v.halo.complexity = 0.01;
			}
		} else {
			v.halo.complexity = 0.5; // Stratified does not vary in complexity.
		}
  }

  this.normalizeSpeed = function(v) {
    if (v.radiant == true) {
  	  if (this.currentHeartRatio > 0.0) {
	  	  v.halo.speed = this.currHeartRatio;
	  	} else {
	    	v.halo.speed = 0.01;
		  }
    } else {
		  v.halo.speed = 0.5;
		}
  }

  this.normalizeWobble = function(v) {
		if (v.radiant == true) {
	      v.halo.wobble = 1.0 - this.hoursStood;
	    }
		else {
		  v.halo.wobble = 0;
		}
  }

  /* 0-10000 steps linear to 75%
     10k-20k linear to 100%
     over 20k tossed.
  */
  this.normalizeSize = function(v) {

    var size = 1.0;
    if (this.activity <= 0) {
      size = 0.00001;
    } else if (this.activity <= 10000) {
      size = this.activity * 0.000075;
    } else if (this.activity < 20000) {
      size = 0.75 + ((this.activity - 10000) * 0.000025);
    }

    v.halo.size = size;
  }

  this.normalizeBrightness = function(v) {
    // Not data driven in this implementation.
    v.halo.brightness = 1.0;
  }

  this.simplifyHeartArray = function() {
  	var condensedHeart = [];
  	var hSum = 0;
  	var i;
  	for (i = 0; i < this.allAdjustedHeartRatios.length; i++) {
  		hSum += this.allAdjustedHeartRatios[i];
  		if (i % 10 == 0) {
  			condensedHeart.push(hSum / 10);
  			hSum = 0;
  		}
  	}
  	if (i % 10 > 0) {
  		condensedHeart.push(hSum / i % 10);
  	}
  	return condensedHeart;
  }

  this.normalizeColorFill = function(v) {
  	v.halo.color = 0.0001;
    if (v.radiant == true) {
    	if (!isNaN(this.lowAdjustedHeartAverageRatio) && this.lowAdjustedHeartAverageRatio > 0.0) {
        v.halo.color = this.lowAdjustedHeartAverageRatio;
    	}
	  } else {
      if (this.allAdjustedHeartRatios.length > 0) {
	      v.halo.color = this.simplifyHeartArray();
		  }
    }
  }

  this.normalizeColorGradient = function(v) {
    if (v.radiant == true) {
      v.halo.colorCenter      = this.peakAdjustedHeartRatio;
      v.halo.colorCenterRatio = Math.min(0.99, this.exerciseMin * 0.0333);
    }
  }

  this.normalizeWaves = function(v) {
  	if (v.radiant == true) {
	    if (this.stepDelta > 10) {
	      var s = this.stepDelta;
	      if (s > 100) {
	        s = 100;
	      }
	      v.halo.waveIntensity = s / 100;
	    } else {
	      v.halo.waveIntensity = 0.0;
	    }
	  } else {
	  	v.halo.waveIntensity = 0.0;
	  }
  }

  this.normalizeStratifiedMode = function(v) {
	  v.halo.stratified = !v.radiant;
  }

  this.normalizeView = function(view) {
    this.normalizeComplexity(view);
    this.normalizeColorFill(view);
    this.normalizeColorGradient(view);
    this.normalizeWobble(view);
    this.normalizeSpeed(view);
    this.normalizeBrightness(view);
    this.normalizeWaves(view);
		this.normalizeStratifiedMode(view);
		this.normalizeSize(view);

		if (this.noDataMode) {
			view.halo.size = 0.25;
			view.halo.complexity = 0.25;
			view.halo.minRingRadius = 0;
			view.halo.maxRingRadius = 0.5;
			view.halo.stratified = false;
			view.halo.color = 0.0;
			view.halo.colorCenter = 0.2;
			view.halo.colorCenterRatio = 0.5;
		}
		else {
			view.halo.minRingRadius = 0.35;
			view.halo.maxRingRadius = 1.00;
		}

    if (view.radiant == true) {
    	view.halo.highlightRing = 0.75;
    } else {
    	view.halo.highlightRing = 1.1;
    }
  }
}

var MayoController = (function() {

	var user  = null;
	var model = [];
	var state = new ViewState();
	var curr  = new Date();
	var view  = new View();
	var observers = [];
	var timeIndex = 0;
	var beat      = -1;
	var bct       = 0;
	var historicalView = false;
	var maxTimeIndex   = 143;

	function resetModel() {
		beat = -1;
		bct  = 0;
		model = [];
		for (var i = 0; i <= maxTimeIndex; i++) {
			model[i] = new MetricInterval();
			model[i].label = Math.floor(i / 6) + ':' + (i % 6) + '0';
		}
	}

	function updateHalo() {

		if (model.length == 0) {
			resetModel();
		}

		state.recompute(user, model, timeIndex);
		state.normalizeView(view);
		view.render();
	}

	/* birthdate expected in form YYYY-MM-DD
	   height in cm
	   wieght in kg
	 */
	function setUserData(birthdate, userHeight, userWeight, gender) {
		user = new User(birthdate, userHeight, userWeight, gender);
	}

	// Check the date!
	function advanceDateIfRequired() {
		var d = new Date();
		if (d.getYear()  != curr.getYear()  ||
			  d.getMonth() != curr.getMonth() ||
			  d.getDate()  != curr.getDate() )
		{
			resetModel();
			curr  = d;
		}
	}

	// Are we not receiving data for today?
	function dataIsObsolete(date) {
		if (date.getYear()  != curr.getYear() ||
				date.getMonth() != curr.getMonth() ||
				date.getDate()  != curr.getDate() ) {
			return true;
		}
		return false;
	}

	// Heavy lifting of metric updating. Could have done this polymorphically, but... meh.
	function updateMetric(d, idx, b) {
		switch(d.type) {
		case 'HKQuantityTypeIdentifierHeartRate':
			if (d.unit != 'count/min' && d.unit != 'bpm') {
				return false;
			}
			model[idx].htot += d.value;
			model[idx].hcount ++;
			model[idx].heart = d.value;
			model[idx].havg = model[idx].htot / model[idx].hcount;
			if (d.value > model[idx].hpeak) {
				model[idx].hpeak = d.value;
			}
			if (b == beat) {
				if (bct == 0 && d.value >= user.heartTarget) {
					model[idx].exmin++;
					bct = 1;
				}
			} else {
				beat = b;
				bct  = 0;
			}
			break;
		case 'HKQuantityTypeIdentifierStepCount':
			if (d.unit != 'count') {
				return false;
			}
			model[idx].steps += d.value;
			break;
		case 'HKQuantityTypeIdentifierDistanceWalkingRunning':
			if (d.unit != 'mi') {
				return false;
			}
			model[idx].dist += d.value;
			break;
		case 'HKQuantityTypeIdentifierDistanceCycling':
			if (d.unit != 'mi') {
				return false;
			}
			model[idx].cdist += d.value;
			break;
		case 'HKQuantityTypeIdentifierBasalEnergyBurned':
			if (d.unit != 'kcal') {
				return false;
			}
			// Ignore this one for now.
			break;
		case 'HKQuantityTypeIdentifierActiveEnergyBurned':
			if (d.unit != 'kcal') {
				return false;
			}
			model[idx].kcal += d.value;
			model[idx].met  =  model[idx].kcal / user.weight;
			break;
		case 'HKCategoryTypeIdentifierAppleStandHour':
			if (d.value == 'HKCategoryValueAppleStandHourStood') {
				model[idx].stood = 1;
			}
			break;
		case 'HKQuantityTypeIdentifierFlightsClimbed':
			if (d.unit != 'count') {
				return false;
			}
			model[idx].flights += d.value;
			break;
		default:
			console.log("Unexpected metric type: " + d.type);
			return false;
		}
		return true;
	}

	/* Update the model with additional data. */
	function addModelData(d) {

		// Find metric interval.
		var t = new Date(d.time);

		// Restrict updates to current day, advancing that if required.
		if (!historicalView) {
			advanceDateIfRequired(t);
			if (dataIsObsolete(t)) {
				return;
			}
		}

		// Identify metric interval.
		var h = t.getHours();
		var m = t.getMinutes();
		var b = h * 60 + m;
		var idx = h * 6 + Math.floor(m / 10);
		if (idx > timeIndex) {
			timeIndex = idx;
		}
		if (!updateMetric(d, idx, b)) {
			console.log("Error updating metric " + d.type + " with unit: " + d.unit + " and value: " + d.value);
		} else {
			model[idx].deviceOn = true;
		}
	}

	/* Primary entry point for handling new data. */
	function append(data) {

		// Keep date current, accept data only for current date.
		if (!historicalView) {
			advanceDateIfRequired();
		}

		if (model.length == 0) {
			resetModel();
		}

		// Process input.
		if (Array.isArray(data)) {
			for (var i = 0; i < data.length; i++) {
				addModelData(data[i]);
			}
		} else {
			addModelData(data);
		}

		// Recompute for view. Q? What if deltas are negligible? Can we optimize to recompute less?
		updateHalo();
	}

	/* Blow away all prior data and start fresh. */
	function reset(data) {
		resetModel();
		append(data);
	}

	function setDisplayMode(mode) {
		if (mode == 'radiant') {
			view.radiant = true;
		} else if (mode == 'stratified') {
			view.radiant = false;
		} else {
			console.log("Unexpected input to displayMode: " + mode);
		}
		updateHalo();
	}

	function addObserver(fn) {
		this.observers.push(fn);
	}

	function removeObserver(fn) {
		for (var i = 0; i < this.observers.length; i++) {
			if (this.observers[i] === fn) {
				this.observers = this.observers.splice(i, 1);
			}
		}
	}

	function setTimeIndex(idx) {
		if (idx > maxTimeIndex) { idx = maxTimeIndex; }
		timeIndex = idx;
		updateHalo();
	}

	function setHistoricalView(allow) {
		historicalView = allow;
	}

	function getUser() {
		return user;
	}

	function getModel() {
		return model;
	}

	function getView() {
		return view;
	}

	function getState() {
		return state;
	}

	function getIndex() {
		return timeIndex;
	}

	return {

		/* setUserData
		 *
		 * Supply global user data required for computing the halo.
		 *   birthdate: YYYY-MM-DD
		 *   height:    cm
		 *   weight:    kg
		 *   gender:    'male' or 'female'
		 */
		setUserData:  setUserData,

		/* appendHKData
		 *
		 * Adds new HealthKit data to the system. Can take a single healthkit value, or an array of HK data points.
		 * After every appendHKData call, the halo gui will be updated. Accordingly, it is better to batch
		 * value updates than to send them singly.
		 *
		 * Each data point is an object:
		 *   {
		 *     time:  string, fmt: YYYY-MM-DD HH:MM:SS TZ
		 *     param: string e.g.  HKQuantityTypeIdentifierHeartRate
		 *     unit:  string e.g.  'count/min
		 *     value: mixed
		 *   }
		 *
		 * Example:
		 *
		 * MayoController.append({ time: '2016-04-09 08:04:22 -07:00',
		 *                         param: 'HKQuantityTypeIdentifierHeartRate',
		 *                         unit:  'count/min',
		 *                         value: 73 });
		 *
		 * Or, obviously, an array of these objects.
		 *
		 * Accepted/expected healthkit parameters, and expected units.
		 *
		 *   HKQuantityTypeIdentifierHeartRate  : 'count/min'
		 *   HKQuantityTypeIdentifierStepCount  : 'count'
		 *   HKQuantityTypeIdentifierDistanceWalkingRunning : 'mi'
		 *   HKQuantityTypeIdentifierDistanceCycling : 'mi'
		 *   HKQuantityTypeIdentifierBasalEnergyBurned : 'kcal'
		 *   HKQuantityTypeIdentifierActiveEnergyBurned : 'kcal'
		 *   HKCategoryTypeIdentifierAppleStandHour : units, null, but value must be:
		 *                                            HKCategoryValueAppleStandHourStood
		 *                                         or HKCategoryValueAppleStandHourIdle
		 *   HKQuantityTypeIdentifierFlightsClimbed : 'count'
		 *
		 * Note that these are the units we have seen in sample data - if units supplied by the
		 * device turn out to be different from user to user, e.g., if distance uses a different
		 * length type, conversion is TBD, either in the supplier of this information, or in an
		 * update to this file.
		 *
		 */
		appendHKData: append,

		/* resetHKData
		 *
		 * Supply all HK Data for the active day.
		 * Replaces all prior data.
		 * To be used on application start.
		 *
		 * Must be an array of HealthKit data objects. See above for reference.
		 */
		resetHKData:  reset,

		/* setDisplayMode
		 *
		 * The halo may be in 'radiant' or 'stratified' modes. Pass in one of these two strings.
		 */
		setDisplayMode: setDisplayMode,

		/* Observer -- mainly used for demo site, probably.
		 *
		 * Register for notifications on data change.
		 *
		 */
		addObserver:    addObserver,
		removeObserver: removeObserver,

		/* Set time index -- for demo site. */
		setTimeIndex:   setTimeIndex,

		/* Set historical data view -- for demo site. */
		setHistoricalView: setHistoricalView,

		/****
		 **** TEST ACCESS
		 ****
		 ****/

		getModel: getModel,
		getUser:  getUser,
		getView:  getView,
		getState: getState,
		getIndex: getIndex

	}

})();
