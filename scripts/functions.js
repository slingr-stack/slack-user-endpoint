
var genericSlackFunction = function(options) {
    options = options || {};

    return endpoint._post(options);
};

var slackFunction = function(path, options) {
    options = options || {};

    return genericSlackFunction({
        path: path,
        params: options
    });
};

var downloadFile = function(options, callbackData, callbacks) {
    options = options || {};
    if (!options.file_id) {
        throw 'Parameter file_id is required';
    }
    var fileInfo = endpoint.files.info({file: options.file_id});
    if (!fileInfo.file || !fileInfo.file.url_private_download) {
        throw 'File not found';
    }
    return endpoint._downloadFile({
        path: fileInfo.file.url_private_download,
        downloadSync: options.sync,
    }, callbackData, callbacks);
};

/////////////////////
// Public API
/////////////////////
endpoint.api = {};
endpoint.api.test 		= function(options){ return slackFunction('api.test', options) };

endpoint.auth = {};
endpoint.auth.revoke 	= function(options){ return slackFunction('auth.revoke',    options) };
endpoint.auth.test 		= function(options){ return slackFunction('auth.test',      options) };

endpoint.bots = {};
endpoint.bots.info 		= function(options){ return slackFunction('bots.info',  options) };

endpoint.channels = {};
endpoint.channels.archive 	= function(options){ return slackFunction('channels.archive',		options) };
endpoint.channels.create 	= function(options){ return slackFunction('channels.create',		options) };
endpoint.channels.history 	= function(options){ return slackFunction('channels.history',		options) };
endpoint.channels.info 		= function(options){ return slackFunction('channels.info',			options) };
endpoint.channels.invite 	= function(options){ return slackFunction('channels.invite',		options) };
endpoint.channels.join 		= function(options){ return slackFunction('channels.join',			options) };
endpoint.channels.kick 		= function(options){ return slackFunction('channels.kick',			options) };
endpoint.channels.leave 	= function(options){ return slackFunction('channels.leave',			options) };
endpoint.channels.list 		= function(options){ return slackFunction('channels.list',			options) };
endpoint.channels.mark 		= function(options){ return slackFunction('channels.mark',			options) };
endpoint.channels.rename 	= function(options){ return slackFunction('channels.rename',		options) };
endpoint.channels.replies 	= function(options){ return slackFunction('channels.replies',		options) };
endpoint.channels.setPurpose= function(options){ return slackFunction('channels.setPurpose',	options) };
endpoint.channels.setTopic 	= function(options){ return slackFunction('channels.setTopic',		options) };
endpoint.channels.unarchive = function(options){ return slackFunction('channels.unarchive',	    options) };

endpoint.chat = {};
endpoint.chat.delete 		= function(options){ return slackFunction('chat.delete',		options) };
endpoint.chat.meMessage 	= function(options){ return slackFunction('chat.meMessage',		options) };
endpoint.chat.postMessage 	= function(options){ return slackFunction('chat.postMessage',	options) };
endpoint.chat.unfurl 		= function(options){ return slackFunction('chat.unfurl',		options) };
endpoint.chat.update 		= function(options){ return slackFunction('chat.update',		options) };

endpoint.conversations = {};
endpoint.conversations.archive 	  = function(options){ return slackFunction('conversations.archive',	options) };
endpoint.conversations.close 	  = function(options){ return slackFunction('conversations.close',		options) };
endpoint.conversations.create 	  = function(options){ return slackFunction('conversations.create',		options) };
endpoint.conversations.history 	  = function(options){ return slackFunction('conversations.history',	options) };
endpoint.conversations.info 	  = function(options){ return slackFunction('conversations.info',		options) };
endpoint.conversations.invite 	  = function(options){ return slackFunction('conversations.invite',		options) };
endpoint.conversations.join 	  = function(options){ return slackFunction('conversations.join',		options) };
endpoint.conversations.kick 	  = function(options){ return slackFunction('conversations.kick',		options) };
endpoint.conversations.leave 	  = function(options){ return slackFunction('conversations.leave',		options) };
endpoint.conversations.list 	  = function(options){ return slackFunction('conversations.list',		options) };
endpoint.conversations.members 	  = function(options){ return slackFunction('conversations.members',	options) };
endpoint.conversations.open 	  = function(options){ return slackFunction('conversations.open',		options) };
endpoint.conversations.rename 	  = function(options){ return slackFunction('conversations.rename',		options) };
endpoint.conversations.replies 	  = function(options){ return slackFunction('conversations.replies',	options) };
endpoint.conversations.setPurpose = function(options){ return slackFunction('conversations.setPurpose',	options) };
endpoint.conversations.setTopic   = function(options){ return slackFunction('conversations.setTopic',	options) };
endpoint.conversations.unarchive  = function(options){ return slackFunction('conversations.unarchive',	options) };

endpoint.dialog = {};
endpoint.dialog.open           = function(options){ return slackFunction('dialog.open',	options) };

endpoint.dnd = {};
endpoint.dnd.endDnd 		= function(options){ return slackFunction('dnd.endDnd',		options) };
endpoint.dnd.endSnooze 		= function(options){ return slackFunction('dnd.endSnooze',	options) };
endpoint.dnd.info 		    = function(options){ return slackFunction('dnd.info',		options) };
endpoint.dnd.setSnooze 		= function(options){ return slackFunction('dnd.setSnooze',	options) };
endpoint.dnd.teamInfo 		= function(options){ return slackFunction('dnd.teamInfo',	options) };

endpoint.emoji = {};
endpoint.emoji.list 		= function(options){ return slackFunction('emoji.list', options) };

endpoint.files = {};
endpoint.files.comments = {};
endpoint.files.comments.add 	= function(options){ return slackFunction('files.comments.add',		options) };
endpoint.files.comments.delete 	= function(options){ return slackFunction('files.comments.delete',	options) };
endpoint.files.comments.edit 	= function(options){ return slackFunction('files.comments.edit',	options) };
endpoint.files.delete 		    = function(options){ return slackFunction('files.delete',			options) };
endpoint.files.info 		    = function(options){ return slackFunction('files.info',			    options) };
endpoint.files.list 		    = function(options){ return slackFunction('files.list',			    options) };
endpoint.files.revokePublicURL 	= function(options){ return slackFunction('files.revokePublicURL',	options) };
endpoint.files.sharedPublicURL 	= function(options){ return slackFunction('files.sharedPublicURL',	options) };
endpoint.files.upload 		    = function(options){ return slackFunction('files.upload',			options) };
endpoint.files.download 	    = function(options, callbackData, callbacks){ return downloadFile(options, callbackData, callbacks) };

endpoint.groups = {};
endpoint.groups.archive 	= function(options){ return slackFunction('groups.archive',		options) };
endpoint.groups.close 		= function(options){ return slackFunction('groups.close',		options) };
endpoint.groups.create 		= function(options){ return slackFunction('groups.create',		options) };
endpoint.groups.createChild = function(options){ return slackFunction('groups.createChild',	options) };
endpoint.groups.history 	= function(options){ return slackFunction('groups.history',		options) };
endpoint.groups.info 		= function(options){ return slackFunction('groups.info',		options) };
endpoint.groups.invite 		= function(options){ return slackFunction('groups.invite',		options) };
endpoint.groups.kick 		= function(options){ return slackFunction('groups.kick',		options) };
endpoint.groups.leave 		= function(options){ return slackFunction('groups.leave',		options) };
endpoint.groups.list 		= function(options){ return slackFunction('groups.list',		options) };
endpoint.groups.mark 		= function(options){ return slackFunction('groups.mark',		options) };
endpoint.groups.open 		= function(options){ return slackFunction('groups.open',		options) };
endpoint.groups.rename 		= function(options){ return slackFunction('groups.rename',		options) };
endpoint.groups.replies 	= function(options){ return slackFunction('groups.replies',		options) };
endpoint.groups.setPurpose 	= function(options){ return slackFunction('groups.setPurpose',	options) };
endpoint.groups.setTopic 	= function(options){ return slackFunction('groups.setTopic',	options) };
endpoint.groups.unarchive 	= function(options){ return slackFunction('groups.unarchive',	options) };

endpoint.im = {};
endpoint.im.close 		= function(options){ return slackFunction('im.close',	options) };
endpoint.im.history 	= function(options){ return slackFunction('im.history',	options) };
endpoint.im.list 		= function(options){ return slackFunction('im.list',	options) };
endpoint.im.mark 		= function(options){ return slackFunction('im.mark',	options) };
endpoint.im.open 		= function(options){ return slackFunction('im.open',	options) };
endpoint.im.replies 	= function(options){ return slackFunction('im.replies',	options) };

endpoint.mpim = {};
endpoint.mpim.close 	= function(options){ return slackFunction('mpim.close',		options) };
endpoint.mpim.history 	= function(options){ return slackFunction('mpim.history',	options) };
endpoint.mpim.list 		= function(options){ return slackFunction('mpim.list',		options) };
endpoint.mpim.mark 		= function(options){ return slackFunction('mpim.mark',		options) };
endpoint.mpim.open 		= function(options){ return slackFunction('mpim.open',		options) };
endpoint.mpim.replies 	= function(options){ return slackFunction('mpim.replies',	options) };

endpoint.oauth = {};
endpoint.oauth.access 	= function(options){ return slackFunction('oauth.access', options) };

endpoint.pins = {};
endpoint.pins.add 		= function(options){ return slackFunction('pins.add',	options) };
endpoint.pins.list 		= function(options){ return slackFunction('pins.list',	options) };
endpoint.pins.remove 	= function(options){ return slackFunction('pins.remove',options) };

endpoint.reactions = {};
endpoint.reactions.add 		= function(options){ return slackFunction('reactions.add',		options) };
endpoint.reactions.get 		= function(options){ return slackFunction('reactions.get',		options) };
endpoint.reactions.list 	= function(options){ return slackFunction('reactions.list',		options) };
endpoint.reactions.remove 	= function(options){ return slackFunction('reactions.remove',	options) };

endpoint.reminders = {};
endpoint.reminders.add 		= function(options){ return slackFunction('reminders.add',		options) };
endpoint.reminders.complete = function(options){ return slackFunction('reminders.complete',	options) };
endpoint.reminders.delete 	= function(options){ return slackFunction('reminders.delete',	options) };
endpoint.reminders.info 	= function(options){ return slackFunction('reminders.info',		options) };
endpoint.reminders.list 	= function(options){ return slackFunction('reminders.list',		options) };

endpoint.search = {};
endpoint.search.all 		= function(options){ return slackFunction('search.all',		options) };
endpoint.search.files 		= function(options){ return slackFunction('search.files',	options) };
endpoint.search.messages 	= function(options){ return slackFunction('search.messages',options) };

endpoint.stars = {};
endpoint.stars.add 		= function(options){ return slackFunction('stars.add',		options) };
endpoint.stars.list 	= function(options){ return slackFunction('stars.list',		options) };
endpoint.stars.remove 	= function(options){ return slackFunction('stars.remove',	options) };

endpoint.team = {};
endpoint.team.accessLogs 	    = function(options){ return slackFunction('team.accessLogs',		options) };
endpoint.team.billableInfo 	    = function(options){ return slackFunction('team.billableInfo',		options) };
endpoint.team.info 		        = function(options){ return slackFunction('team.info',			    options) };
endpoint.team.integrationLogs   = function(options){ return slackFunction('team.integrationLogs',	options) };

endpoint.team.profile = {};
endpoint.team.profile.get 	= function(options){ return slackFunction('team.profile.get', options) };

endpoint.usergroups = {};
endpoint.usergroups.create 		= function(options){ return slackFunction('usergroups.create',		options) };
endpoint.usergroups.disable 	= function(options){ return slackFunction('usergroups.disable',		options) };
endpoint.usergroups.enable 		= function(options){ return slackFunction('usergroups.enable',		options) };
endpoint.usergroups.list 		= function(options){ return slackFunction('usergroups.list',		options) };
endpoint.usergroups.update 		= function(options){ return slackFunction('usergroups.update',		options) };
endpoint.usergroups.users = {};
endpoint.usergroups.users.list 	= function(options){ return slackFunction('usergroups.users.list',	options) };
endpoint.usergroups.users.update= function(options){ return slackFunction('usergroups.users.update',options) };

endpoint.users = {};
endpoint.users.deletePhoto 	= function(options){ return slackFunction('users.deletePhoto',	options) };
endpoint.users.getPresence 	= function(options){ return slackFunction('users.getPresence',	options) };
endpoint.users.identity 	= function(options){ return slackFunction('users.identity',		options) };
endpoint.users.info 		= function(options){ return slackFunction('users.info',			options) };
endpoint.users.list 		= function(options){ return slackFunction('users.list',			options) };
endpoint.users.lookupByEmail= function(options){ return slackFunction('users.lookupByEmail',options) };
endpoint.users.setActive 	= function(options){ return slackFunction('users.setActive',	options) };
endpoint.users.setPhoto 	= function(options){ return slackFunction('users.setPhoto',		options) };
endpoint.users.setPresence 	= function(options){ return slackFunction('users.setPresence',	options) };
endpoint.users.profile = {};
endpoint.users.profile.get 	= function(options){ return slackFunction('users.profile.get',	options) };
endpoint.users.profile.set 	= function(options){ return slackFunction('users.profile.set',	options) };

// generic functions
endpoint.get = function(options){ return genericSlackFunction(options) };
endpoint.post = function(options){ return genericSlackFunction(options) };

// helpers

endpoint.respondToSlashCommand = function(responseUrl, message) {
    return endpoint._globalPost({
        path: responseUrl,
        headers: {
            "Content-Type": "application/json"
        },
        body: message
    });
};

endpoint.respondToInteractiveMessage = function(responseUrl, message) {
    return endpoint._globalPost({
        path: responseUrl,
        headers: {
            "Content-Type": "application/json"
        },
        body: message
    });
};

endpoint.sendOptions = function(event, options) {
    return endpoint._sendOptions({
        event: event,
        options: options
    });
};

/////////////////////
// conversions
/////////////////////

endpoint.getDate = function(timestamp) {
    if(!timestamp){
        throw 'Timestamp is empty'
    }
    var response = null;
    try {
        var r = endpoint._convertTimestamp({
            key: timestamp
        });
        if(!!r && !!r.value) {
            response = new Date(r.value);
        }
    } catch (e){
        // exception
    }
    return response;
};

