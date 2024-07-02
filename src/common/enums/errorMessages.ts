export const errorMessages = {
  USER_WITH_EMAIL_ALREADY_EXISTS: 'This email is already used by another user.',
  ENTITY_NOT_FOUND: 'Entity Not Found',
  ERROR_CREATING_USER_IN_DB: 'An error occured while inserting User in DB.',
  SERVER_ERROR: 'An error occured in server.',
  VALIDATION_ERROR: 'Validation is failed.',
  PROJECT_NOT_FOUND: (id: string) => `The project with id ${id} was not found.`,
};
