export const errorMessages = {
  NONE_OPERATIONAL_ERROR:
    'Something went very wrong! This is not Operational Error.',
  USER_WITH_EMAIL_ALREADY_EXISTS: 'This email is already used by another user.',
  ERROR_CREATING_USER_IN_DB: 'An error occured while inserting User in DB.',
  SERVER_ERROR: 'An error occured in server.',
  VALIDATION_ERROR: 'The validation has failed.',
  ENTITY_NOT_FOUND: (entity: string, id: string) =>
    `${entity} with id ${id} was not found.`,
  BAD_REQUEST_LOGIN_ERROR: 'Please provide email or password.',
  INCORRECT_EMAIL_OR_PASSWORD: 'Incorrect email or password.',
};
