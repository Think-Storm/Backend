export const errorMessages = {
  NONE_OPERATIONAL_ERROR:
    'Something went very wrong! This is not Operational Error.',
  USER_WITH_EMAIL_ALREADY_EXISTS: 'This email is already used by another user.',
  ERROR_CREATING_USER_IN_DB: 'An error occurred while inserting User in DB.',
  ERROR_SEARCHING_PROJECTS:
    'An error occurred while searching projects for your queries.',
  ERROR_UPDATING_PROJECTS: 'An error occurred while updating project.',
  ERROR_DELETING_PROJECTS: 'An error occurred while deleting project.',
  ERROR_FINDING_PROJECTS: 'An error occurred while finding projects.',
  ERROR_GETTING_USER_BY_EMAIL: 'An error occurred while getting user by email.',
  ERROR_GETTING_USER_BY_ID: 'An error occurred while getting user by id.',
  ERROR_CREATING_USER: 'An error occurred while creating user.',
  BAD_REQUEST: 'Wrong client request. Check your request format again.',
  ERROR_CREATING_PROJECT_IN_DB:
    'An error occurred while inserting Project in DB.',
  SERVER_ERROR: 'An error occurred in server.',
  VALIDATION_ERROR: 'The validation has failed.',
  ENTITY_NOT_FOUND: (entity: string, id: string) =>
    `${entity} with id ${id} was not found.`,
  BAD_REQUEST_LOGIN_ERROR: 'Please provide email and password.',
  INCORRECT_EMAIL_OR_PASSWORD: 'Incorrect email or password.',
  PROTECT_ROUTES: 'You are not logged in! Please log in to get access.',
  INVALID_TOKEN: 'Invalid Token. Please log in again!',
  TOKEN_EXPIRED: 'Your token has expired. Please log in again!',
  USER_CHANGED_PASSWORD: 'User recently changed password! Please log in again!',
  FORBIDDEN: (message: string) => `Forbidden. ${message}`,
  THROTTLER_BLOCK:
    'Too many requests. You have been blocked. Try again in 1 hour.',
  FOREIGN_KEY_CONSTRAINT_VIOLATION:
    'Please check with foreign key constraint before you perform.',
};
