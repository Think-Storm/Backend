export const errorMessages = {
  NONE_OPERATIONAL_ERROR:
    'Something went very wrong! This is not Operational Error.',
  WAITING_LIST_USER_WITH_EMAIL_ALREADY_EXISTS:
    'This email is already subscribed to the newsletter.',
  USER_WITH_EMAIL_ALREADY_EXISTS: 'This email is already used by another user.',
  ERROR_CREATING_USER_IN_DB: 'An error occurred while inserting User in DB.',
  ERROR_SEARCHING_PROJECTS:
    'An error occurred while searching projects for your queries.',
  ERROR_UPDATING_PROJECTS: 'An error occurred while updating project.',
  ERROR_CONNECTING_PROJECT_USERS:
    'An error occurred while connecting project users',
  ERROR_DELETING_PROJECTS: 'An error occurred while deleting project.',
  ERROR_FINDING_PROJECTS: 'An error occurred while finding projects.',
  ERROR_SAVING_PROJECTS: 'An error occurred while saving projects.',
  ERROR_UNSAVING_PROJECTS: 'An error occurred while unsaving projects.',
  USER_ALREADY_SAVED_PROJECT: 'User already saved the project.',
  CURRENT_USER_NOT_SAVED_PROJECT: 'Current user did not save the project.',
  UNSAVE_USER_IN_REQ_BODY_NOT_SAVED_PROJECT:
    'User in request body did not save the project.',
  ERROR_GETTING_USER_BY_EMAIL: 'An error occurred while getting user by email.',
  ERROR_GETTING_USER_BY_ID: 'An error occurred while getting user by id.',
  ERROR_CREATING_USER: 'An error occurred while creating user.',
  ERROR_UPDATING_USER: 'An error occurred while updating user.',
  ERROR_UPDATING_PASSWORD_USER:
    'An error occurred while updating user password.',
  BAD_REQUEST: 'Wrong client request. Check your request format again.',
  BAD_REQUEST_PASSWORD:
    'Password confirmation failed. Please retype your password confirmation.',
  ERROR_CREATING_PROJECT_IN_DB:
    'An error occurred while inserting Project in DB.',
  SERVER_ERROR: 'An error occurred in server.',
  VALIDATION_ERROR: 'The validation has failed.',
  ENTITY_NOT_FOUND: (entity: string, id: string) =>
    `${entity} with id ${id} was not found.`,
  ENTITY_NOT_FOUND_MSG: (entity: string, message: string) =>
    `${entity} with ${message} was not found.`,
  ENTITY_NOT_FOUND_LANGUAGE: 'language was not found.',
  BAD_REQUEST_LOGIN_ERROR: 'Please provide email and password.',
  INCORRECT_EMAIL_OR_PASSWORD: 'Incorrect email or password.',
  PROTECT_ROUTES: 'You are not logged in! Please log in to get access.',
  INVALID_TOKEN: 'Invalid Token.',
  TOKEN_EXPIRED: 'Your token has expired.',
  USER_CHANGED_PASSWORD: 'User recently changed password! Please log in again!',
  FORBIDDEN: (message: string) => `Forbidden. ${message}`,
  THROTTLER_BLOCK:
    'Too many requests. You have been blocked. Try again in 1 hour.',
  FOREIGN_KEY_CONSTRAINT_VIOLATION:
    'Please check with foreign key constraint before you perform.',
  CACHING_TTL_ERROR: 'TTL must be a valid positive integer',
  REDIS_CONNECTION_ISSUE: (message: string) =>
    `Redis connection issue. ${message}`,
  ERROR_CREATING_NOTIFICATION_IN_DB:
    'An error occurred while creating notification in DB.',
  ERROR_FINDING_NOTIFICATIONS: 'An error occurred while finding notifications.',
  ERROR_DELETING_NOTIFICATION_IN_DB:
    'An error occurred while deleting notification in DB.',
  ERROR_DELETING_NOTIFICATIONS_IN_DB:
    'An error occurred while deleting notifications in DB.',
  ERROR_FINDING_NOTIFICATION: 'An error occurred while finding notification.',
  ERROR_UPDATING_NOTIFICATION: 'Error updating notification',
  ERROR_DELETING_USER: 'An error occurred while deleting user.',
  ERROR_UPDATING_USER_PROFILE: 'An error occurred while updating user profile.',
  ERROR_DELETING_USER_PROFILE: 'An error occurred while deleting user profile.',
  ERROR_CREATING_JOIN_REQUEST: 'An error occurred while creating join request.',
  USER_ALREADY_JOINED_REQUEST:
    'You have already sent a join request to this project.',
};
