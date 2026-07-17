/**
 * Created by jhoffsis on 7/29/15.
 */

define (['backbone', 'marionette', 'app/vent'], function (Backbone, Marionette, vent) {
    var trackingmodel = Backbone.Model.extend({

        DEFAULT: '',
        LOCATION: 'cmi.location',
        STATUS: 'cmi.completion_status',
        SUCCESS: 'cmi.success_status',
        SCORE_RAW: 'cmi.score.raw',
        STUDENT_ID: 'cmi.learner_id',
        LEARNER_NAME: 'cmi.learner_name',
        CREDIT: 'cmi.credit',
        ENTRY: 'cmi.entry',
        EXIT: 'cmi.exit',
        LAUNCH_DATA: 'cmi.launch_data',
        SESSION_TIME: 'cmi.session_time',
        SUSPEND_DATA: 'cmi.suspend_data',
        TOTAL_TIME: 'cmi.total_time',
        INTERACTIONS: 'cmi.interactions',
        PROGRESS_MEASURE: 'cmi.progress_measure',

        url: '',
        inLMS: false,
        courseStatus: '',
        progress_ar: [],
        dict: {},
        startTime: null,
        time_interval: null,
        enabledFields: [],
        logLevel: 6,

        initialize: function (options) {

            this.app = options.app;

            this.storagePrefix = this.app.model.get('projectID') + '_' + this.app.model.get('version').replace(/ /g,'').toLowerCase();

            this.moduleCollection = this.app.model.moduleCollection;

            this.unloaded = false;

            this.listenTo(this.moduleCollection, 'change', this.onModuleCollectionChanged);

            //this.listenTo(this.app.model, 'appModel:role-reset', this.onAppModelReset)
            this.listenTo(vent, 'appModel:role-reset', this.onAppModelReset);


            this.inLMS = options.inLMS;

            this.dict = {};
            this.dict[this.LOCATION] = null;
            this.dict[this.STATUS] = null;
            this.dict[this.SUCCESS] = null;
            this.dict[this.SCORE_RAW] = null;
            this.dict[this.STUDENT_ID] = null;
            this.dict[this.LEARNER_NAME] = null;
            this.dict[this.CREDIT] = null;
            this.dict[this.ENTRY] = null;
            this.dict[this.EXIT] = null;
            this.dict[this.LAUNCH_DATA] = null;
            this.dict[this.SESSION_TIME] = null;
            this.dict[this.SUSPEND_DATA] = null;
            this.dict[this.TOTAL_TIME] = null;
            this.dict[this.PROGRESS_MEASURE] = null;

            this.enabledFields = ['ENTRY', 'TOTAL_TIME', 'LOCATION', 'STATUS', 'SUCCESS', 'SUSPEND_DATA', 'SESSION_TIME', 'PROGRESS_MEASURE', 'EXIT', 'LEARNER_NAME'];
            this.READ_ONLY = ['ENTRY', 'TOTAL_TIME'];
            this.WRITE_ONLY = ['SESSION_TIME', 'EXIT'];

            this.listenTo(vent, 'quiz:commit-data', this.commitQuizData);

            this.startTime = new Date().getTime();

            this.time_interval = setInterval(function () {
                this.updateSessionTime();
            }.bind(this), 10000);

            this.fetch();

        },

        onAppModelReset: function () {
            this.moduleCollection = this.app.model.moduleCollection;

            var max = this.moduleCollection.length;

            if (this.progress_ar.length > max) {
                this.progress_ar = this.progress_ar.slice(0, max);
            }

            this.setValue('location', this.getStatusString());

            trace('LEN: ' + this.progress_ar.length, 5);

            this.listenTo(this.moduleCollection, 'change', this.onModuleCollectionChanged);

            this.fetch();

        },

        onModuleCollectionChanged: function (item) {
            trace('LocalStorageModel: onMenuModelChanged()', this.logLevel);
            var id = item.get('id'),
                status = parseInt(item.get('status'));

            this.progress_ar[id] = status;

            this.setValue('location', this.getStatusString());

            this.setValue('progress_measure', this.getPercentComplete()/100);

            this.checkStatus();
        },

        setAllComplete: function () {
            var len = this.moduleCollection.length,
                i = 0;

            this.progress_ar = [];
            for (; i < len; i++) {
                this.progress_ar.push(2);
            }

            this.setValue('location', this.getStatusString());
        },

        setCourseComplete: function () {
            this.setAllComplete();
            this.setValue('status', "completed");
        },

        setStatus: function () {
            var items = this.moduleCollection,
                location = this.getValue('location').toString(), val;

            this.progress_ar = location.split('|');
            items.each(function (item, index) {
                val = parseInt(this.progress_ar[index]) || 0;
                item.set('status', val, {'silent':true});
            }.bind(this));

        },

        checkStatus: function () {
            var items = this.moduleCollection,
                allCompleted = items.every(function (item) {return item.get('status') == 2;}),
                noneStarted = items.every(function (item) {return item.get('status') == 0;}),
                oldStatus = this.courseStatus;

            if (items.length == 0 || noneStarted) {
                this.courseStatus = 'notStarted';
            } else if (allCompleted) {
                this.courseStatus = 'completed';
            } else {
                this.courseStatus = 'incomplete';
            }

            if(this.courseStatus != oldStatus) {
                if (this.courseStatus == 'completed') {
                    this.setValue('status', "completed");
                    this.setValue('success', "passed");
                } else {
                    this.setValue('status', "incomplete");
                }

                vent.trigger('trackingmodel:status-changed');
            }
        },

        getStatusString: function () {
            var progress_str = this.progress_ar.join ('|');
            return progress_str;
        },

        getPercentComplete: function () {
            var items = this.moduleCollection,
                completed = items.filter(function (item) {return item.get('status') == 2;}),
                percentComplete =  Math.floor(completed.length / items.length * 100);

            return percentComplete;
        },

        getCourseStatus: function () {
            this.checkStatus();
            return this.courseStatus;
        },

        sync: function (method) {
            var key, name, val, defaultValue, i;
            switch (method) {
                case 'create':
                    trace('TrackingModel.sync():create', this.logLevel);
                    break;

                case 'read':
                    trace('TrackingModel.sync():read', this.logLevel);
                    this.set('id', 'LMSapi');
                    for (i = 0; i < this.enabledFields.length; i++) {
                        name = this.enabledFields[i];
                        key = this[name];
                        if (this.WRITE_ONLY.indexOf(name) < 0) {
                            val = this.getSavedValue(key);
                            if(val != null && val != "") {
                                this.setValue(this.enabledFields[i], val);
                            } else {
                                defaultValue = this.generateDefaultValue(this.enabledFields[i]);
                                this.setValue(name, defaultValue);
                            }
                        }

                    }
                    var status = this.getValue('STATUS');
                    if(this.app.model.get('setAllComplete') || status === 'completed') {
                        this.setAllComplete();
                    }
                    this.setStatus();
                    this.commitChanges();
                    //roteAPI.SCORM.save();
                    vent.trigger('trackingmodel:sync-read');
                    break;

                case 'update':
                    trace('TrackingModel.sync():update', this.logLevel);
                    for (i = 0; i < this.enabledFields.length; i++) {
                        name = this.enabledFields[i]
                        key = this[name];
                        val = this.dict[key];
                        if(val != null && this.READ_ONLY.indexOf(name) < 0) {
                            this.setSavedValue(name, key, val)
                        }
                    }
                    this.commitChanges();
                    //roteAPI.SCORM.save();
                    break;

                case 'delete':
                    trace('TrackingModel.sync():delete', this.logLevel);
                    break;
            }
            this.trigger('change', {method:method});

        },

        exitCourse: function () {


            if(!this.unloaded) {
                this.updateSessionTime();
                this.save();
                roteAPI.SCORM.quit();
                this.unloaded = true;
            }


            clearInterval(this.time_interval);

            trace('lmsModel.exitCourse()', this.logLevel);
        },

        commitQuizData: function (quizData) {
            var scorm_prefix = this.INTERACTIONS + '.',
                cmi, obj;

            quizData.each( function (item) {
                obj = item.toJSON();
                cmi = scorm_prefix + obj.id + '.';
                this.writeQuizData(cmi, _.pairs(obj));
            }.bind(this));
        },

        writeQuizData: function (cmi, pairs) {
            var i = 0, len = pairs.length,
                key, val;
            for (; i < len; i++) {
                key = cmi + pairs[i][0];
                val = pairs[i][1];

                if(key === 'id') {
                    val = 'id_' + val;
                }

                this.setSavedValue(cmi, key, val)
            }
        },

        isObject: function (obj) {

            if(typeof obj == "object" && obj != null) {
                return true;
            }
            else {
                return false;
            }
        },

        getStudentName: function () {
            var learner_name = this.getValue('learner_name');
            learner_name = learner_name.split(', ').reverse().join(' ');
            return learner_name;
        },

        setValue: function (name, value, dontWrite) {
            dontWrite = dontWrite || false;
            var key = this[name.toUpperCase()];

            if (value == null) {
                return;
            }
            this.dict[key] = value;

            if(!dontWrite && this.READ_ONLY.indexOf(name) < 0) {
                this.setSavedValue(name, key, value);
            }
        },

        getValue: function (name) {
            var key = this[name.toUpperCase()],
                value = this.dict[key];
            return value;
        },

        setSavedValue: function (name, key, val) {
            var prefix = this.storagePrefix + '.',
                result;

            // JSON.stringify complex objects before saving them
            if (this.isObject(val)) {
                val = JSON.stringify(val);
            }

            // save data to LMS or localStorage, depending on context
            if (this.inLMS) {
                // this is single call to save data to LMS, where key is one of a specific set of scorm vars
                result = roteAPI.SCORM.set(key, val);
            } else {
                localStorage.setItem(prefix + key, val);
            }


            vent.trigger('trackingmodel:change');
            vent.trigger('trackingmodel:change-' + name.toLowerCase(), val);
        },

        getSavedValue: function (key) {
            var value = null, rawValue,
                prefix = this.storagePrefix + '.';
            if (this.inLMS) {

                value = roteAPI.SCORM.get(key);

            } else {
                value = localStorage.getItem(prefix + key);
            }

            // if retrieved string is a JSON encoded object, parse it
            try {
                value = JSON.parse(value);
            } catch (e) {}

            return value;
        },

        commitChanges: function () {
            if(this.inLMS) {
                roteAPI.SCORM.save();
            }
        },

        updateSessionTime: function () {
            var success = false,
                dtm = new Date(),
                diff = dtm.getTime() - this.startTime;

            success = this.setValue('session_time', this.centisecsToISODuration(Math.floor(diff/10)));
        },

        centisecsToISODuration: function (n) {
            // Note: SCORM and IEEE 1484.11.1 require centisec precision
            // Months calculated by approximation based on average number
            // of days over 4 years (365*4+1), not counting the extra day
            // every 1000 years. If a reference date was available,
            // the calculation could be more precise, but becomes complex,
            // since the exact result depends on where the reference date
            // falls within the period (e.g. beginning, end or ???)
            // 1 year ~ (365*4+1)/4*60*60*24*100 = 3155760000 centiseconds
            // 1 month ~ (365*4+1)/48*60*60*24*100 = 262980000 centiseconds
            // 1 day = 8640000 centiseconds
            // 1 hour = 360000 centiseconds
            // 1 minute = 6000 centiseconds
            n = Math.max(n,0); // there is no such thing as a negative duration
            var str = "P";
            var nCs = n;
            // Next set of operations uses whole seconds
            var nY = Math.floor(nCs / 3155760000);
            nCs -= nY * 3155760000;
            var nM = Math.floor(nCs / 262980000);
            nCs -= nM * 262980000;
            var nD = Math.floor(nCs / 8640000);
            nCs -= nD * 8640000;
            var nH = Math.floor(nCs / 360000);
            nCs -= nH * 360000;
            var nMin = Math.floor(nCs /6000);
            nCs -= nMin * 6000;
            // Now we can construct string
            if (nY > 0) str += nY + "Y";
            if (nM > 0) str += nM + "M";
            if (nD > 0) str += nD + "D";
            if ((nH > 0) || (nMin > 0) || (nCs > 0)) {
                str += "T";
                if (nH > 0) str += nH + "H";
                if (nMin > 0) str += nMin + "M";
                if (nCs > 0) str += (nCs / 100) + "S";
            }
            if (str == "P") str = "PT0H0M0S";
            // technically PT0S should do but SCORM test suite assumes longer form.

            return str;


        },

        generateDefaultValue: function (name) {
            var value;

            switch (name) {
                case 'LOCATION':
                    var len = this.moduleCollection.length,
                        i = 0;

                    this.progress_ar = [];
                    for (; i < len; i++) {
                        this.progress_ar.push(0);
                    }
                    trace('LEN: ' + this.progress_ar.length, 5);

                    value = this.progress_ar.join ('|');
                    break;

                case 'STATUS':
                    value = 'incomplete';
                    break;
                case 'SUCCESS':
                    value = 'unknown';
                    break;

                case 'PROGRESS_MEASURE':
                    value = 0;
                    break;

                case 'SCORE_RAW':
                    value = 0;
                    break;

                case 'SUSPEND_DATA':
                    value = {'points':0, 'name': 'John', 'role': this.app.model.get('defaultRole')};
                    break;

                case 'LEARNER_NAME':
                    value = 'Name, Student';
                    break;

                default:
                    value = null;
            }

            return value;
        },

        clearStorage: function () {

            if(this.inLMS) {
                var name, defaultValue, i;
                for (i = 0; i < this.enabledFields.length; i++) {
                    name = this.enabledFields[i];

                    defaultValue = this.generateDefaultValue(this.enabledFields[i]);
                    this.setValue(name, defaultValue);

                }
            } else {
                localStorage.clear();
            }
        }

    });

    return trackingmodel;
});