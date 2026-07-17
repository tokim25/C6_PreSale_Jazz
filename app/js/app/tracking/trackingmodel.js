/**
 * Created by jhoffsis on 7/29/15.
 */

define (['backbone', 'marionette', 'app/vent'], function (Backbone, Marionette, vent) {
    var trackingmodel = Backbone.Model.extend({

        LOCATION: 'cmi.core.lesson_location',
        STATUS: 'cmi.core.lesson_status',
        SCORE_RAW: 'cmi.core.score.raw',
        STUDENT_ID: 'cmi.core.student_id',
        STUDENT_NAME: 'cmi.core.student_name',
        CREDIT: 'cmi.core.credit',
        ENTRY: 'cmi.core.entry',
        EXIT: 'cmi.core.exit',
        LAUNCH_DATA: 'cmi.launch_data',
        SESSION_TIME: 'cmi.core.session_time',
        SUSPEND_DATA: 'cmi.suspend_data',
        TOTAL_TIME: 'cmi.core.total_time',
        INTERACTIONS: 'cmi.interactions',

        url: '',
        inLMS: false,
        courseStatus: '',
        progress_ar: [],
        dict: {},
        startTime: null,
        time_interval: null,
        enabledFields: [],
        logLevel: 1,

        initialize: function (options) {

            this.app = options.app;

            this.storagePrefix = this.app.model.get('projectID') + '_' + this.app.model.get('version').replace(/ /g,'').toLowerCase();

            this.moduleCollection = this.app.model.moduleCollection;

            this.listenTo(this.moduleCollection, 'change', this.onModuleCollectionChanged);

            //this.listenTo(this.app.model, 'appModel:role-reset', this.onAppModelReset)
            this.listenTo(vent, 'appModel:role-reset', this.onAppModelReset);


            this.inLMS = options.inLMS;

            this.dict = {};
            this.dict[this.LOCATION] = null;
            this.dict[this.STATUS] = null;
            this.dict[this.SCORE_RAW] = null;
            this.dict[this.STUDENT_ID] = null;
            this.dict[this.STUDENT_NAME] = null;
            this.dict[this.CREDIT] = null;
            this.dict[this.ENTRY] = null;
            this.dict[this.EXIT] = null;
            this.dict[this.LAUNCH_DATA] = null;
            this.dict[this.SESSION_TIME] = null;
            this.dict[this.SUSPEND_DATA] = null;
            this.dict[this.TOTAL_TIME] = null;

            this.enabledFields = ['LOCATION', 'STATUS', 'SCORE_RAW', 'SUSPEND_DATA', 'SESSION_TIME', 'TOTAL_TIME'];

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

        setStatus: function () {
            var items = this.moduleCollection,
                val;

            this.progress_ar = this.getValue('location').split('|');
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
                        val = this.getSavedValue(key);
                        if(val != null && val != "") {
                            this.setValue(this.enabledFields[i], val);
                        } else {
                            defaultValue = this.generateDefaultValue(this.enabledFields[i]);
                            this.setValue(name, defaultValue);
                        }
                    }
                    var status = this.getValue('STATUS');
                    if(this.app.model.get('setAllComplete') || status === 'completed') {
                        this.setAllComplete();
                    }
                    this.setStatus();
                    vent.trigger('trackingmodel:sync-read');
                    break;

                case 'update':
                    trace('TrackingModel.sync():update', this.logLevel);
                    for (i = 0; i < this.enabledFields.length; i++) {
                        name = this.enabledFields[i]
                        key = this[name];
                        val = this.dict[key];
                        if(val != null) {
                            this.setSavedValue(name, key, val)
                        }
                    }
                    break;

                case 'delete':
                    trace('TrackingModel.sync():delete', this.logLevel);
                    break;
            }
            this.trigger('change', {method:method});

        },

        exitCourse: function () {
            this.updateSessionTime();
            this.save();

            clearInterval(this.time_interval);

            trace('lmsModel: ' + exitCourse, this.logLevel);
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

        setValue: function (name, value, dontWrite) {
            dontWrite = dontWrite || false;
            var key = this[name.toUpperCase()];
            this.dict[key] = value;

            if(!dontWrite) {
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
            if(this.inLMS) {
                if (key != this.SUSPEND_DATA) {
                    result = LMSSetValue(key, val);
                } else {
                    result = LMSSetValue(key, JSON.stringify(val));
                }

                if(key === this.STATUS && val === 'completed') {
                    if (result === 'true') {
                        // WE WANT TO FORCE PUSH ANY CACHED VALUES TO THE LMS
                        LMSCommit();
                        LMSFinish();
                    } else {
                        // THIS IS EDGE CASE WHERE STATUS IS NOT PERSISTED TO LMS
                        alert("LMS ERROR: status was NOT set to 'complete' in LMS");
                    }

                }
            } else {
                localStorage.setItem(prefix + key, JSON.stringify(val));
            }

            vent.trigger('trackingmodel:change');
            vent.trigger('trackingmodel:change-' + name.toLowerCase(), val);
        },

        getSavedValue: function (key) {
            var value = null, rawValue,
                prefix = this.storagePrefix + '.';
            if (this.inLMS) {

                if (key == this.SUSPEND_DATA) {

                    try {
                        value = JSON.parse(LMSGetValue(key));
                    } catch (e) {
                        trace('ParseError___', this.logLevel);
                        trace(e, this.logLevel);
                    }
                } else if (key != this.SESSION_TIME) {
                    value = LMSGetValue(key);
                }

            } else {
                value = JSON.parse(localStorage.getItem(prefix + key));
            }
           return value;
        },

        setCourseComplete: function () {
            this.setValue(this.STATUS, 'completed');
        },

        updateSessionTime: function () {
            var currentTime = new Date().getTime(),
                elapsedTime = Math.round((currentTime - this.startTime) / 1000),
                hours = Math.floor(elapsedTime / (60 * 60)),
                divisor_for_minutes = elapsedTime % (60 * 60),
                minutes = Math.floor(divisor_for_minutes / 60),
                divisor_for_seconds = divisor_for_minutes % 60,
                seconds = Math.ceil(divisor_for_seconds),
                session_time = '';

            if (hours < 10) hours = "0" + hours;

            if (minutes < 10) minutes = "0" + minutes;

            if (seconds < 10) seconds = "0" + seconds;

            session_time = hours + ":" + minutes + ":" + seconds;

            this.setValue('session_time', session_time);

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

                case 'SCORE_RAW':
                    value = null;
                    break;

                case 'SUSPEND_DATA':
                    value = {'points':0, 'name': 'John', 'role': this.app.model.get('defaultRole')};
                    break;

                case 'SESSION_TIME':
                    value = '00:00:00';
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