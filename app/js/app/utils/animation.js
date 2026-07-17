/**
 * Created with JetBrains WebStorm.
 * User: johnhoffsis
 * Date: 1/28/16
 * Time: 3:10 PM
 * To change this template use File | Settings | File Templates.
 */


define(['backbone', 'tweenmax'], function (Backbone, TweenMax) {

    var Animation = {

        buildTimeline: function (animObj) {

            var scope = animObj.scope, tl = animObj.tl, tweenList = animObj.tweenList || null,
                splits = animObj.splits || null, animMap = animObj.animMap || null,
                tween, tween_props, i;

            _.each(tweenList, function(tweenObj) {
                var tweens = tweenObj.tweens, label = tweenObj.id;
                tl.addLabel(label);
                for (i = 0; i < tweens.length; i++) {
                    tween_props = tweens[i];
                    if (tween_props.type === 'pause') {
                        tl.addPause('+=0.5');
                    } else {
                        tween = this.getTween(scope, tween_props, animMap);
                        if(tween.split != undefined && splits != undefined) {
                            splits.push(tween.split);
                        }
                        if(tween_props.startTime != undefined ) {

                            tl.add(tween, tween_props.startTime)
                        } else {
                            tl.add(tween)

                        }
                    }


                }
                tl.addPause();
            }.bind(this));

            return tl;
        },

        getTween: function (scope, tween_props, animMap) {
            var tween,
                target = typeof tween_props.id === 'string' ? '#' + tween_props.id : tween_props.id,
                split, i;

            if (typeof tween_props.props === 'string' && animMap[tween_props.props] != undefined) {
                tween_props.props = animMap[tween_props.props];
            }
            tween_props.ease = tween_props.ease != undefined ? EaseLookup.find(tween_props.ease) : Power2.easeIn;
            tween_props.duration = tween_props.duration != undefined ? tween_props.duration : 0.3;

            switch (tween_props.type) {
                case 'set':
                    tween = TweenMax.set(target, tween_props.props);
                    break;
                case 'pause':
                    break;
                case 'from':
                case 'to':
                    tween = TweenMax[tween_props.type](target, tween_props.duration, tween_props.props);
                    break;
                case 'staggerFrom':
                case 'staggerTo':
                    tween = TweenMax[tween_props.type](target, tween_props.duration, tween_props.props, tween_props.staggerOffset);
                    break;
                case 'fromTo':
                case 'toFrom':
                    tween = TweenMax[tween_props.type](target, tween_props.duration, tween_props.props1, tween_props.props2);
                    break
                case 'staggerFromTo':
                case 'staggerToFrom':
                    tween = TweenMax[tween_props.type](target, tween_props.duration, tween_props.props1, tween_props.props2, tween_props.staggerOffset);
                    break;
                case 'splitText':
                    split = new SplitText('#' + tween_props.id, tween_props.splitConfig);
                    tween_props.tweenProps.id = tween_props.splitConfig.type === "chars" ? split.chars : tween_props.splitConfig.type === "words" ? split.words : split.lines;
                    tween = this.getTween(scope, tween_props.tweenProps, animMap);
                    tween.split = split;
                    break;
                case 'group':
                    tween = [];
                    for (i = 0; i<tween_props.tweens.length; i++) {
                        tween.push(this.getTween(scope, tween_props.tweens[i], animMap));
                    }
                    break;
                case 'callback':
                    tween = function () {
                        //[tween_props.method].apply(scope, tween_props.args)
                        scope[tween_props.method].call(scope, tween_props.args, scope[tween_props.callback] || null);
                        //tw.play();
                    }.bind(this);


            }

            return tween;
        }

    };
    _.extend(Animation, Backbone.Events);
    return Animation;
})
