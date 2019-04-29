package io.slingr.endpoints.slackuser;

import io.slingr.endpoints.HttpPerUserEndpoint;
import io.slingr.endpoints.exceptions.EndpointException;
import io.slingr.endpoints.exceptions.ErrorCode;
import io.slingr.endpoints.framework.annotations.*;
import io.slingr.endpoints.services.AppLogs;
import io.slingr.endpoints.services.datastores.DataStoreResponse;
import io.slingr.endpoints.services.exchange.Parameter;
import io.slingr.endpoints.services.exchange.ReservedName;
import io.slingr.endpoints.utils.Json;
import io.slingr.endpoints.ws.exchange.FunctionRequest;
import io.slingr.endpoints.ws.exchange.WebServiceRequest;
import io.slingr.endpoints.ws.exchange.WebServiceResponse;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.entity.ContentType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

/**
 * <p>Slack user endpoint
 *
 * <p>Created by dgaviola on 08/22/17.
 */
@SlingrEndpoint(name = "slack-user")
public class SlackUserEndpoint extends HttpPerUserEndpoint {
    private static final Logger logger = LoggerFactory.getLogger(io.slingr.endpoints.slackuser.SlackUserEndpoint.class);

    private static final String API_URL = "https://slack.com/api";

    @ApplicationLogger
    private AppLogs appLogger;

    @EndpointProperty
    private String clientId;

    @EndpointProperty
    private String clientSecret;

    @EndpointProperty
    private String verificationToken;

    public SlackUserEndpoint() {
    }

    @Override
    public void endpointStarted() {
        httpService().setupDefaultHeader("Content-Type", "application/x-www-form-urlencoded");
        httpService().setFollowRedirects(true);
        httpService().setAllowExternalUrl(true);
    }

    @Override
    public String getApiUri() {
        return API_URL;
    }

    // Authentication process

    @EndpointWebService(path = "authCallback")
    public WebServiceResponse authCallback(WebServiceRequest request) {
        return new WebServiceResponse("<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\">\n" +
                "<html>\n" +
                "<head>\n" +
                "<title>Slack authentication</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "</body>\n" +
                "</html>", ContentType.TEXT_HTML.toString()
        );
    }

    @EndpointFunction(name = ReservedName.CONNECT_USER)
    public Json connectUser(FunctionRequest request) {
        final String userId = request.getUserId();
        if(StringUtils.isNotBlank(userId)) {
            // checks if the user includes a non-empty 'code' on the request
            Json body = request.getJsonParams();
            if (StringUtils.isNotBlank(body.string("code"))) {
                String code = body.string("code");
                Json requestBody = Json.map()
                        .set("path", "/oauth.access")
                        .set("body", Json.map()
                                .set("client_id", clientId)
                                .set("client_secret", clientSecret)
                                .set("code", code)
                                .set("redirect_uri", body.string("redirectUri"))
                        );
                Json res = globalPost(new FunctionRequest(Json.map().set(Parameter.PARAMS, requestBody)));

                if (res.bool("ok")) {
                    // saves the information on the users data store
                    Json conf = users().save(userId, res);
                    logger.info(String.format("User connected [%s] [%s]", userId, conf.toString()));

                    // sends connected user event
                    users().sendUserConnectedEvent(request.getFunctionId(), userId, conf);

                    return conf;
                } else {
                    logger.warn(String.format("Problems trying to connect user [%s] to Slack: %s", userId, res.toString()));
                    appLogger.warn(String.format("Problems trying to connect user [%s] to Slack: %s", userId, res.string("error")));
                }
            } else {
                logger.info(String.format("Empty 'code' when try to connect user [%s] [%s]", userId, request.getParams() != null ? request.getParams().toString() : ""));
            }
        }
        defaultMethodDisconnectUsers(request);
        return Json.map();
    }

    // Internal methods

    @EndpointFunction(name = "_globalPost")
    public Json globalPost(FunctionRequest request) {
        try {
            // continue with the default processor
            Json res = defaultPostRequest(request);
            if (res != null && res.contains("ok") && !res.bool("ok")) {
                logger.warn(String.format("Error making request to [%s]: %s", request.getJsonParams().string("path"), res.toString()));
                throw EndpointException.permanent(ErrorCode.API, String.format("Error returned by the Slack API: %s", res.string("error")), res);
            }
            return res;
        } catch (EndpointException restException) {
            throw restException;
        }
    }

    @EndpointFunction(name = "_post")
    public Json post(FunctionRequest request) {
        try {
            Json body = request.getJsonParams();
            Json params = body.json("params");
            if (params == null) {
                params = Json.map();
            }
            params.set("token", getToken(request));
            body.remove("send_as_user");
            if ("files.upload".equals(body.string("path")) && params.contains("file_id")) {
                body.set("multipart", true);
                Json parts = Json.list();
                Json part = Json.map()
                        .set("name", "file")
                        .set("type", "file")
                        .set("fileId", params.string("file_id"));
                parts.push(part);
                body.set("parts", parts);
                params.remove("file_id");
            }
            convertParamsToString(params);
            body.set("params", params);
            Json res = defaultPostRequest(request);
            if (!res.bool("ok")) {
                logger.warn(String.format("Error making request to [%s] with token [****%s]: %s", body.string("path"), StringUtils.right(params.string("token"), 4), res.toString()));
                throw EndpointException.permanent(ErrorCode.API, String.format("Error returned by the Slack API: %s", res.string("error")), res);
            }
            return res;
        } catch (EndpointException restException) {
            if (restException.getCode() == ErrorCode.CLIENT) {
                users().sendUserDisconnectedEvent(request.getUserId());
            }
            throw restException;
        }
    }

    @EndpointFunction(name = "_downloadFile")
    public Json downloadFile(FunctionRequest request) {
        try {
            // add some needed params
            Json body = request.getJsonParams();
            body.set("forceDownload", true);
            Json headers = Json.map().set("Authorization", "Bearer "+getToken(request));
            body.set("headers", headers);
            // continue with the default processor
            return defaultGetRequest(request);
        } catch (EndpointException restException) {
            if (restException.getCode() == ErrorCode.CLIENT) {
                users().sendUserDisconnectedEvent(request.getUserId());
            }
            throw restException;
        }
    }

    private void convertParamsToString(Json params) {
        // we convert all params to string to avoid issues
        for (String key : params.keys()) {
            Object value = params.object(key);
            if (value != null && !(value instanceof String)) {
                params.set(key, value.toString());
            }
        }
    }

    private String getToken(FunctionRequest request) {
        Json userConfig = users().findById(request.getUserId());
        if (userConfig == null) {
            throw EndpointException.permanent(ErrorCode.CLIENT, String.format("User [%s] is not connected", request.getUserEmail()));
        }
        Json params = request.getJsonParams().json("params");
        if (params != null && params.contains("send_as_user") && params.bool("send_as_user")) {
            return userConfig.string("access_token");
        } else {
            Json botInfo = userConfig.json("bot");
            if (botInfo == null) {
                throw EndpointException.permanent(ErrorCode.CLIENT, "Bot is not configured in Slack app");
            }
            return botInfo.string("bot_access_token");
        }
    }

    @EndpointFunction(name = "_convertTimestamp")
    public Json convertTimestamp(FunctionRequest request) {
        Json res = Json.map();
        double ts = Double.valueOf(request.getJsonParams().string("key"));
        ts = ts * 1000;
        res.set("value", (long) ts);
        return Json.map();
    }

    // Events

    @EndpointWebService(path = "/events")
    public Json events(WebServiceRequest request) {
        Json body = request.getJsonBody();
        String token = body.string("token");
        if (!verificationToken.equals(token)) {
            throw EndpointException.permanent(ErrorCode.ARGUMENT, "Invalid verification token");
        }
        String type = body.string("type");
        if ("url_verification".equals(type)) {
            return Json.map().set("challenge", body.string("challenge"));
        } else {
            DataStoreResponse configs = userDataStore().find(Json.map().set("team_id", body.string("team_id")));
            if(configs != null) {
                for (Json config : configs.getItems()) {
                    events().send("httpEventArrived", body.json("event"), null, config.string("_id"));
                }
            }
            return Json.map();
        }
    }

    @EndpointWebService(path = "/slashCommands")
    public String slashCommands(WebServiceRequest request) {
        Json body = request.getJsonBody();
        String token = body.string("token");
        if (!verificationToken.equals(token)) {
            throw EndpointException.permanent(ErrorCode.ARGUMENT, "Invalid verification token");
        }
        DataStoreResponse configs = userDataStore().find(Json.map().set("team_id", body.string("team_id")));
        if(configs != null) {
            for (Json config : configs.getItems()) {
                events().send("slashCommand", body, null, config.string("_id"));
            }
        }
        return "";
    }

    @EndpointWebService(path = "/interactiveMessages")
    public String interactiveMessages(WebServiceRequest request) {
        Json body = request.getJsonBody();
        if (body.contains("payload")) {
            body = body.json("payload");
        }
        String token = body.string("token");
        if (!verificationToken.equals(token)) {
            throw EndpointException.permanent(ErrorCode.ARGUMENT, "Invalid verification token");
        }
        if (body.contains("ssl_check")) {
            return "";
        }
        DataStoreResponse configs = userDataStore().find(Json.map().set("team_id", body.json("team").string("id")));
        if(configs != null) {
            for (Json config : configs.getItems()) {
                events().send("interactiveMessage", body, null, config.string("_id"));
            }
        }
        return "";
    }

    @EndpointWebService(path = "/optionsLoad")
    public WebServiceResponse optionsLoad(WebServiceRequest request) {
        Json body = request.getJsonBody();
        if (body.contains("payload")) {
            body = body.json("payload");
        }
        String token = body.string("token");
        if (!verificationToken.equals(token)) {
            throw EndpointException.permanent(ErrorCode.ARGUMENT, "Invalid verification token");
        }
        if (body.contains("ssl_check")) {
            return new WebServiceResponse();
        }
        DataStoreResponse configs = userDataStore().find(Json.map().set("team_id", body.json("team").string("id")));
        if(configs != null) {
            for (Json config : configs.getItems()) {
                try {
                    Json options = (Json) events().sendSync("optionsLoad", body, null, config.string("_id"));
                    return new WebServiceResponse(options, ContentType.APPLICATION_JSON.toString());
                } catch (ClassCastException cce) {
                    appLogger.error("The app returned an invalid response when loading options. It must be a valid JSON.");
                } catch (Exception e) {
                    appLogger.error("There was an error loading options: " + e.getMessage(), e);
                }
            }
        }
        return new WebServiceResponse(Json.map().set("options", Json.list()), ContentType.APPLICATION_JSON.toString());
    }
}