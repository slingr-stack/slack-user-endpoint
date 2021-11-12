---
title: Slack user endpoint
keywords: 
last_updated: August 24, 2017
tags: []
summary: "Detailed description of the API of the Slack user endpoint."
---

## Overview

This endpoint is very similar to the regular [Slack endpoint]({{site.baseurl}}/endpoints_slack.html). The main differences 
is that with this endpoint each user can connect to a different team and it doesn't support the Real Time Messaging API. 
The rest of the features are exactly the same:

- Shortcuts for web API
- Interactive messages
- Slash commands
- Events API
- Conversations

As in the regular Slack endpoint, in most cases data formats and methods available are the same you can find in the 
[Slack API documentation](https://api.slack.com), so we strongly suggest to read it and understand how it works.

## Configuration

In order to use the Slack user endpoint you will need to create a [Slack app](https://api.slack.com/slack-apps).
Depending on the features you need to use from the endpoint you will need to enable different
features in the Slack app:

- **Bot users**: if you want to use bots, you will need to add a bot to your Slack app. That can be
  done from the app page in Slack, in the section `Bot Users`.
- **Slash commands**: if you need slash commands, you have create them in your Slack app. When configuring
  an slash command you will be asked to enter the `Request URL`. This URL is available in the endpoint's
  configuration screen in the field `Slash commands URL`.
- **Interactive messages**: if you need interactive messages, you have to enable that in your Slack app. When
  doing so you will be requested to enter the `Request URL`. This URL is available in the endpoints's
  configuration screen in the field `Interactive messages URL`.
  If you need to support dynamic options in dropdowns, you can also configure the `Options Load URL` here.
- **Events API**: if you need events to be sent over HTTP, you can enable events in your Slack app. You will
  be asked to enter the `Request URL`. This URL is available in the endpoint's configuration screen in the
  field `Events URL`.
  
Other things you need to take into account:

- **Check scopes**: in your Slack app, in the section `OAuth & Permissions`, make sure the following scopes
  are selected:
  - `bot`: needed to use the real time API.
  - `commands`: this is optional and only needed if you want to use slash commands.
  - `chat:write:user`: this is option and only needed if you want to post messages on behalf of a user.
  Also in the `Events` section you will need to confirm which events you want to process. If you want to make
  conversation works you have to enable at least these events:
  - `message.channel`
  - `message.group`
  - `message.im`
  - `message.pim`
- **Install app on your team**: right from the configuration of your Slack app you will be able to install
  the app on your team. That will provide you the user and bot token, that will be needed during the
  configuration of the endpoint.
- **Events subscriptions**: before enabling this feature you will need to make sure the Slack endpoint is
  already deployed. This is because Slack will check the URL is valid in order to allow to save the URL.
  This means that you will need to create the endpoint, configure basic settings, push changes, make sure
  endpoint is deployed and then you will be able to configure events subscriptions in your Slack app.
  
Below we describe the settings that can be configure for the endpoint.  
  
### Client ID

The client ID is used to perform the OAuth process. You will find it in the `Basic information` of your app in the 
field `Client ID`.

### Client secret

The client secret is used to perform the OAuth process. You will find it in the `Basic information` of your app in the 
field `Client Secret`.

### Verification token

The verification token is used to validate the slash commands and interactive messages hitting the endpoint. You
will find it in the `Basic information` of your app in the field `Verification Token`.

### Slash commands URL

This is a read-only field and indicates the URL you have to configure in your Slack app to receive slash commands
in your SLINGR app.

### Interactive messages URL

This is a read-only field and indicates the URL you have to configure in your Slack app to receive interactive
messages in your SLINGR app.

### Options load URL

This is a read-only field and indicates the URL you have to configure in your Slack app to be able to provide
custom options in dropdowns. This is configured in the same place where you configure the interactive messages
URL.

### Events URL

This is a read-only field and indicates the URL you have to configure to subscribe to the events API. Keep in mind
that the endpoint has to be deployed before configuring the events API in your Slack app because Slack will make
a test request to validate the URL, which will be valid only when the endpoint is deployed.

## Quick start

Once you have configured the endpoint, you will need to connect at least one user to the endpoint (by going to
`My integrations` in the secondary menu of the app runtime). Then scripts need to be run with the user you have
connected.

Send a message to a channel:

```js
app.endpoints.slack.chat.postMessage({
  channel: '#test',
  text: 'hello!'
});
```

You can see more parameters to send messages [here](https://api.slack.com/methods/chat.postMessage).

You can process an event coming from the RTM API in a listener like this:

```js
if (event.data.type == 'message') {
  var channelName = app.endpoints.slack.getChannelName(event.data.channel);
  var userName = app.endpoints.slack.getUserName(event.data.user);
  var timestamp = app.endpoints.slack.getDate(event.data.ts);
  var text = event.data.text;
  sys.logs.info('On ['+timestamp+'] user ['+userName+'] wrote in channel ['+channelName+']: '+text);
}
```

You can see the full format of messages coming from the RTM API [here](https://api.slack.com/rtm).

## Javascript API

This is exactly the same as the regular [Slack endpoint]({{site.baseurl}}/endpoints_slack.html#javascript-api). Please
refer to that documentation.

The only helpers that aren't available are:

- `getTeamName(id)`: returns the team's name for the given team ID.
- `getUserName(id)`: returns the user's name for the given user ID.
- `getChannelName(id)`: returns the channel's name for the given channel ID.

You will need to use other methods to get teams, users, and channels names.

## Events

The events you will get are exactly the same as the regular [Slack endpoint]({{site.baseurl}}/endpoints_slack.html#javascript-api).
Please refer to that documentation.

The only event that isn't available is the one for real time events as that feature is not supported in this endpoint.

Another thing to keep in mind is that when a listeners catching an Slack event is executed, the current user in the
context will be set to the associated user for the Slack team that generated the event.

## About SLINGR

SLINGR is a low-code rapid application development platform that accelerates development, with robust architecture for integrations and executing custom workflows and automation.

[More info about SLINGR](https://slingr.io)

## License

This endpoint is licensed under the Apache License 2.0. See the `LICENSE` file for more details.


