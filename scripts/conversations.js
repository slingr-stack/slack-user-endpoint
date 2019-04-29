// global configuration for conversations
var bot = endpoint;
var botUserId = null;
var convoPrefix = bot._name+'_convos_';
var registeredConvos = {};

/**
 utility method that helps to match message events based on some characteristics:
 - patterns: can be a keyword or regular expressions
 - messgeTypes: could be direct_mention, mention, direct_message, ambient
 - callback: function to be called when the message matches
 returns true if there is a match; false otherwise
 **/
var matchMessage = function(event, patterns, messageTypes, callback) {
    var botUserId = getBotUserId();
    if (event.endpointEvent == 'httpEventArrived') {
        var msg = event.data;
        if (msg.type != 'message') {
            // if this is not a message we can discard it completely
            return false;
        }
        if (msg.user == botUserId) {
            // ignore messages comming from the bot to avoid loops
            return false;
        }
        if (msg.subtype) {
            // we ignore any subtype, like when a message is replaced
            return false;
        }
        // detect the type of message
        var msgType = 'ambient';
        var msgText = '';
        if (msg.channel[0] == 'D') {
            // if the channel starts with D, it is a direct message
            msgType = 'direct_message';
            msgText = msg.text;
        } else {
            var mention = '<@'+botUserId+'>';
            if (msg.text.trim().indexOf(mention) === 0) {
                // if the message starts with the name of the bot, it is considered a direct mention
                msgType = 'direct_mention';
                // we consider only the text after the mention
                msgText = msg.text.trim().substr(mention.length);
                if (msgText.indexOf(':')) {
                    // many times colons are added after mention
                    msgText = msgText.substr(1);
                }
                msgText = msgText.trim();
            } else if (msg.text.indexOf(mention) != -1) {
                // this is a mention, but not direct because it is in the middle of the message
                msgType = 'mention';
                msgText = msg.text.trim();
            } else {
                // this is just an ambient message
                msgText = msg.text.trim();
            }
        }
        // see if message matches criteria
        if ((Array.isArray(messageTypes) && messageTypes.indexOf(msgType) == -1) || (typeof messageTypes === 'string' && msgType != messageTypes)) {
            // message type does not match
            return false;
        }
        // check patterns
        var pattern, match;
        if (Array.isArray(patterns)) {
            for (var i in patterns) {
                pattern = new RegExp(patterns[i], 'i');
                match = msgText.match(pattern);
                if (match) {
                    callback({text: msgText, type: msgType, pattern: patterns[i], match: match}, event);
                    return true;
                }
            }
        } else {
            match = msgText.match(patterns);
            if (match) {
                callback({text: msgText, type: msgType, pattern: pattern, match: match}, event);
                return true;
            }
        }
    } else if (event.endpointEvent == 'interactiveMessage') {
        if (event.data.type == 'dialog_submission') {
            // dialogs submissions are not handled here
            return false;
        }
        // check patterns
        var checkPattern = function(event, pattern) {
            var match = false, actions = event.data.actions, keyValue, action, actionValue;
            if (pattern.indexOf('button[') == 0) {
                try {
                    keyValue = pattern.substr('button['.length, pattern.length-'button['.length-1).split('=');
                    if (keyValue.length != 2) {
                        sys.logs.error('Pattern ['+pattern+'] is not valid');
                        return false;
                    }
                } catch (e) {
                    sys.logs.error('Pattern ['+pattern+'] is not valid');
                    return false;
                }
                for (var j in actions) {
                    action = actions[j];
                    if (action.name == keyValue[0] && (action.value == keyValue[1] || keyValue[1] == '*')) {
                        match = true;
                        actionValue = action.value;
                        break;
                    }
                }
            } else if (pattern.indexOf('select[') == 0) {
                try {
                    keyValue = pattern.substr('select['.length, pattern.length-'select['.length-1).split('=');
                    if (keyValue.length != 2) {
                        sys.logs.error('Pattern ['+pattern+'] is not valid');
                        return false;
                    }
                } catch (e) {
                    sys.logs.error('Pattern ['+pattern+'] is not valid');
                    return false;
                }
                for (var j in actions) {
                    action = actions[j];
                    if (action.name == keyValue[0]) {
                        if (keyValue[1] == '*') {
                            match = true;
                            actionValue = action.selected_options[0].value;
                            break;
                        } else {
                            var selectedOptions = action.selected_options || [];
                            for (var k in selectedOptions) {
                                var selectedOption = selectedOptions[k];
                                if (selectedOption.value == keyValue[1]) {
                                    match = true;
                                    actionValue = selectedOption.value;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if (match) {
                callback({action_name: action.name, action_value: actionValue, pattern: pattern, match: match}, event);
                return true;
            }
            return false;
        };
        if (Array.isArray(patterns)) {
            for (var i in patterns) {
                if (checkPattern(event, patterns[i])) {
                    return true;
                }
            }
        } else {
            if (checkPattern(event, patterns)) {
                return true;
            }
        }
    }
    return false;
};

/**
 replies to an incoming message, using the same channel
 - event: the event you are replying to
 - msg: can be a complex slack message or just a string
 **/
var reply = function(event, msg) {
    var channel = '';
    if (event.endpointEvent == 'httpEventArrived') {
        channel = event.data.channel;
    } else if (event.endpointEvent == 'interactiveMessage') {
        channel = event.data.channel.id;
    } else if (event.endpointEvent == 'manual') {
        channel = event.channel;
    }
    if (typeof msg === 'string') {
        bot.chat.postMessage({
            channel: channel,
            text: msg,
            as_user: true
        });
    } else {
        msg.channel = channel;
        msg.as_user = true;
        bot.chat.postMessage(msg);
    }
};

/**
 replaces the original message with the new message
 - event: the event you are replying
 - msg: can be a complex slack message or just a string
 **/
var replace = function(event, msg) {
    var channel, ts;
    if (event.endpointEvent == 'httpEventArrived' && event.data.type == 'message') {
        channel = event.data.channel;
        ts = event.data.ts;
    } else if (event.endpointEvent == 'interactiveMessage') {
        channel = event.data.channel.id;
        ts = event.data.message_ts;
    } else if (event.endpointEvent == 'manual') {
        sys.exceptions.throwException('badRequest', 'Cannot replace message when conversation has been manually triggered');
    }
    if (typeof msg === 'string') {
        bot.chat.update({
            channel: channel,
            text: msg,
            ts: ts,
            as_user: true
        });
    } else {
        msg.channel = channel;
        msg.as_user = true;
        msg.ts = ts;
        bot.chat.update(msg);
    }
};

/**
 registers a conversation for this app. it will only registers the conversation the first
 time but it won't be executed. handleConversations will take care of calling the correct
 conversation
 - id: the id of the conversation; must be unique
 - patterns: can be a keyword or regular expressions
 - messgeTypes: could be direct_mention, mention, direct_message, ambient
 - callback: function to be called when the message matches
 **/
var registerConvo = function(id, patterns, messageTypes, callback) {
    registeredConvos[id] = {
        patterns: patterns,
        messageTypes: messageTypes,
        callback: callback
    };
};

/**
 * triggers a conversation that has been previously registered. this is useful when the
 * condition is not a message but some other event.
 *
 * id: the id used to register the conversation
 * channelId: the ID of the channel where the conversation has to be triggered
 * userId: the ID of the user that will interact with that conversation
 */
var triggerConvo = function(id, channelId, userId) {
    var convoId = buildConvoIdWithoutEvent(userId, channelId);
    // if there was a conversation in place for this user and channel, remove it as we will start a new one
    sys.storage.remove(convoId);
    // start the new conversation
    var registeredConvo = registeredConvos[id];
    if (!registeredConvo) {
        sys.exceptions.throwException('badRequest', 'Conversation ['+id+'] not found');
    }
    var message = {
        user_id: userId,
        user: '<@' + userId + '>',
        channel_id: channelId,
        channel: '<#' + channelId + '>'
    };
    var event = {
        endpointEvent: 'manual',
        channel: channelId,
        user: userId
    };
    var convo = new Convo({message: message, event: event});
    sys.storage.put(convoId, convo);
    registeredConvo.callback(message, convo, event);
    sys.storage.put(convoId, convo);
};

/**
 process the event and use the corresponding conversation handler if it applies
 - event: event from slack
 **/
var handleConvos = function(event) {
    var botUserId = getBotUserId();
    if (event.endpointEvent == 'httpEventArrived') {
        if (event.data.type != 'message') {
            // if this is not a message we can discard it completely
            return false;
        }
        if (event.data.user == botUserId) {
            // ignore messages comming from the bot to avoid loops
            return false;
        }
        // first check some system commands
        if (matchMessage(event, '\\#cleanup', ['direct_message','direct_mention','mention'], function(message, event) {
                // clear current conversation if it exists
                sys.storage.remove(buildConvoId(event));
                reply(event, "done! i don't remember anything now!");
            })) {
            return false;
        }
        var addInfoToMessage = function(msg, e) {
            msg.user_id = e.data.user;
            msg.user = '<@'+e.data.user+'>';
            msg.channel_id = e.data.channel;
            msg.channel = '<#'+e.data.channel+'>';
        };
        // continue with user-defined conversations
        var convoId = buildConvoId(event);
        var convo = sys.storage.get(convoId);
        if (convo) {
            // there is a conversation in place
            convo = new Convo(convo);
            if (convo.isWaiting()) {
                var callbacks = JSON.parse(convo.callbacks);
                // build message param
                var message = {
                    text: event.data.text
                };
                addInfoToMessage(message, event);
                // update info in conversation
                convo.message = message;
                convo.event = event;
                convo.waitingResponse = false;
                convo.dialogCallback = null;
                var executeCallback = function(callback, message, event) {
                    // call callback
                    var code = '';
                    code += 'var handler = '+callback.callback+';\n';
                    code += 'var data = '+JSON.stringify(callback.data)+';\n';
                    code += 'var message = '+JSON.stringify(message)+';\n';
                    code += 'var event = '+JSON.stringify(event)+';\n';
                    code += 'var convo = new app.endpoints["'+endpoint._name+'"].convo.Convo('+JSON.stringify(convo)+');\n';
                    code += 'handler(message, convo, data, event);\n';
                    code += 'JSON.stringify(convo);\n';
                    var res = sys.utils.script.eval(code);
                    convo = new Convo(JSON.parse(res));
                    if (convo.isWaiting() || convo.hasDialogCallback()) {
                        // we will update conversation in storage
                        sys.storage.put(convoId, convo);
                    } else {
                        // we can remove the conversation from storage
                        sys.storage.remove(convoId);
                    }
                };
                var match = false;
                for (var i in callbacks) {
                    var callback = callbacks[i];
                    if (callback['default']) {
                        // if this is the default callback, we execute it
                        executeCallback(callback, message, event);
                        match = true;
                        break;
                    } else {
                        if (matchMessage(event, callback.patterns, null, function(message, event) {
                                addInfoToMessage(message, event);
                                executeCallback(callback, message, event);
                            })) {
                            match = true;
                            break;
                        }
                    }
                }
                if (match) {
                    return;
                }
            }
            // if we get to this point, this is probably a dead conversation and we have to remove it
            sys.storage.remove(convoId);
        }
        // there is no active conversation; see if it matches any of the conversations we have
        for (var id in registeredConvos) {
            var registeredConvo = registeredConvos[id];
            matchMessage(event, registeredConvo.patterns, registeredConvo.messageTypes, function(message, event) {
                // we need to start a new conversation
                addInfoToMessage(message, event);
                convo = new Convo({message: message, event: event});
                sys.storage.put(convoId, convo);
                registeredConvo.callback(message, convo, event);
                sys.storage.put(convoId, convo);
            });
        }
    } else if (event.endpointEvent == 'interactiveMessage') {
        var addInfoToMessage = function(msg, e) {
            msg.user_id = e.data.user.id;
            msg.user = '<@'+e.data.user.id+'>';
            msg.channel_id = e.data.channel.id;
            msg.channel = '<#'+e.data.channel.id+'>';
        };
        // continue with user-defined conversations
        var convoId = buildConvoId(event);
        var convo = sys.storage.get(convoId);
        if (convo) {
            // there is a conversation in place
            convo = new Convo(convo);
            // build message param
            var message = {
                callback_id: event.data.callback_id
            };
            addInfoToMessage(message, event);
            convo.message = message;
            var executeCallback = function(callback, message, event) {
                // call callback
                var code = '';
                code += 'var handler = '+callback.callback+';\n';
                code += 'var data = '+JSON.stringify(callback.data)+';\n';
                code += 'var message = '+JSON.stringify(message)+';\n';
                code += 'var event = '+JSON.stringify(event)+';\n';
                code += 'var convo = new app.endpoints["'+endpoint._name+'"].convo.Convo('+JSON.stringify(convo)+');\n';
                code += 'handler(message, convo, data, event);\n';
                code += 'JSON.stringify(convo);\n';
                var res = sys.utils.script.eval(code);
                convo = new Convo(JSON.parse(res));
                if (convo.isWaiting() || convo.hasDialogCallback()) {
                    // we will update conversation in storage
                    sys.storage.put(convoId, convo);
                } else {
                    // we can remove the conversation from storage
                    sys.storage.remove(convoId);
                }
            };
            if (event.data.type == 'dialog_submission') {
                if (!convo.dialogCallback) {
                    return;
                }
                var dialogCallback = JSON.parse(convo.dialogCallback);
                convo.dialogCallback = null;
                message.submission = event.data.submission;
                executeCallback(dialogCallback, message, event);
                return;
            } else if (convo.isWaiting()) {
                var callbacks = JSON.parse(convo.callbacks);
                // update info in conversation
                convo.event = event;
                convo.waitingResponse = false;
                convo.dialogCallback = null;
                message.actions = event.data.actions;
                var match = false;
                for (var i in callbacks) {
                    var callback = callbacks[i];
                    if (callback['default']) {
                        // if this is the default callback, we execute it
                        executeCallback(callback, message, event);
                        match = true;
                        break;
                    } else {
                        if (matchMessage(event, callback.patterns, null, function (message, event) {
                                addInfoToMessage(message, event);
                                executeCallback(callback, message, event);
                            })) {
                            match = true;
                            break;
                        }
                    }
                }
                if (match) {
                    return;
                }
            }
            // if we get to this point, this is probably a dead conversation and we have to remove it
            sys.storage.remove(convoId);
        }
        // there is no active conversation; see if it matches any of the conversations we have
        for (var id in registeredConvos) {
            var registeredConvo = registeredConvos[id];
            matchMessage(event, registeredConvo.patterns, registeredConvo.messageTypes, function(message, event) {
                // we need to start a new conversation
                addInfoToMessage(message, event);
                convo = new Convo({message: message, event: event});
                sys.storage.put(convoId, convo);
                registeredConvo.callback(message, convo, event);
                sys.storage.put(convoId, convo);
            });
        }
    }
};

/**
 this object represents a conversation and it keeps the current state of it
 **/
var Convo = function(info) {
    var self = this;

    self.message = null;
    self.event = null;
    self.waitingResponse = false;
    self.callbacks = null;
    self.lastQuestion = null;
    self.dialogCallback = null;

    self.say = function(msg) {
        // TODO we need to throttle this so we send at most 1 message per sec as botkit does
        if (typeof msg == 'object' && msg.replace) {
            delete msg.replace;
            replace(self.event, msg);
        } else {
            reply(self.event, msg);
        }
    };

    self.ask = function(msg, callbacks) {
        self.say(msg);
        self.lastQuestion = msg;
        self.callbacks = self.convertCallbacksToString(callbacks);
        self.waitingResponse = true;
    };

    self.repeat = function(msg, data) {
        if (!self.lastQuestion) {
            sys.exceptions.throwException('badRequest', 'There is not last question, so we cannot repeat it');
        }
        if (data) {
            // if data is sent, we will replace the data object of all callbacks
            var callbacks = JSON.parse(self.callbacks);
            callbacks.forEach(function(callback) {
                callback.data = data;
            });
            self.callbacks = self.convertCallbacksToString(callbacks);
        }
        if (msg) {
            self.say(msg);
            self.lastQuestion = msg;
        } else {
            self.say(self.lastQuestion);
        }
        self.waitingResponse = true;
    };

    self.openDialog = function(dialog, data, callback) {
        if (!self.event || !self.event.data.trigger_id) {
            sys.exceptions.throwException('badRequest', 'There is no trigger for the dialog');
        }
        endpoint.dialog.open({trigger_id: self.event.data.trigger_id, dialog: dialog});
        self.dialogCallback = self.convertDialogCallbackToString({
            callback: callback,
            data: data
        });
    };

    self.stop = function() {
        var convoId = buildConvoId(self.event);
        sys.storage.remove(convoId);
    };

    self.isWaiting = function() {
        return self.waitingResponse;
    };

    self.hasDialogCallback = function() {
        return !!self.dialogCallback;
    };

    self.convertCallbacksToString = function(callbacks) {
        // we need to convert callbacks to strings in order to persist them in the storage engine
        if (typeof callbacks == 'function') {
            callbacks = [{'default': true, callback: callbacks}];
        }
        var jsonCallbacks = [];
        for (var i in callbacks) {
            var callback = callbacks[i];
            var jsonCallback = {
                'default': callback['default'],
                patterns: callback.patterns,
                data: callback.data,
                callback: ''+callback.callback // convert function to string
            };
            jsonCallbacks.push(jsonCallback);
        }
        return JSON.stringify(jsonCallbacks);
    };

    self.convertDialogCallbackToString = function(callback) {
        // we need to convert callbacks to strings in order to persist them in the storage engine
        var jsonCallback = {
            data: callback.data,
            callback: ''+callback.callback // convert function to string
        };
        return JSON.stringify(jsonCallback);
    };

    self.fromJson = function(json) {
        self.message = json.message;
        self.event = json.event;
        self.callbacks = json.callbacks;
        self.waitingResponse = json.waitingResponse;
        self.lastQuestion = json.lastQuestion;
        self.dialogCallback = json.dialogCallback;
    };

    if (info) {
        self.fromJson(info);
    }

    return self;
};

var buildConvoId = function(event) {
    var currentUser = sys.context.getCurrentUser();
    if (event.endpointEvent == 'httpEventArrived') {
        return convoPrefix+currentUser.id()+'_'+event.data.user+'_'+event.data.channel;
    } else if (event.endpointEvent == 'interactiveMessage') {
        return convoPrefix+currentUser.id()+'_'+event.data.user.id+'_'+event.data.channel.id;
    } else {
        sys.exceptions.throwException('badRequest', 'Invalid event');
    }
};

var buildConvoIdWithoutEvent = function(userId, channelId) {
    var currentUser = sys.context.getCurrentUser();
    return convoPrefix+currentUser.id()+'_'+userId+'_'+channelId;
};

var getBotUserId = function() {
    if (!botUserId) {
        var res = bot.get({path: '/auth.test'});
        botUserId = res.user_id;
    }
    return botUserId;
};

var patterns = {
    yes: ['yes', 'y'],
    no: ['no', 'n']
};

// Public API

bot.convo = {};
bot.convo.Convo = Convo;
bot.convo.matchMessage = matchMessage;
bot.convo.reply = reply;
bot.convo.replace = replace;
bot.convo.registerConvo = registerConvo;
bot.convo.handleConvos = handleConvos;
bot.convo.triggerConvo = triggerConvo;
bot.patterns = patterns;