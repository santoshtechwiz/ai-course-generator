"use strict";
/**
 * Shared Chat Types
 * Centralized type definitions to eliminate duplication across chat components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatIntent = void 0;
var ChatIntent;
(function (ChatIntent) {
    ChatIntent["NAVIGATE_COURSE"] = "navigate_course";
    ChatIntent["NAVIGATE_QUIZ"] = "navigate_quiz";
    ChatIntent["CREATE_QUIZ"] = "create_quiz";
    ChatIntent["CREATE_COURSE"] = "create_course";
    ChatIntent["EXPLAIN_CONCEPT"] = "explain_concept";
    ChatIntent["TROUBLESHOOT"] = "troubleshoot";
    ChatIntent["SUBSCRIPTION_INFO"] = "subscription_info";
    ChatIntent["GENERAL_HELP"] = "general_help";
    ChatIntent["OFF_TOPIC"] = "off_topic";
})(ChatIntent || (exports.ChatIntent = ChatIntent = {}));
