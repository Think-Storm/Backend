export const errorMessages = {
  USER_WITH_EMAIL_ALREADY_EXISTS: 'This email is already used by another user.',
  ERROR_CREATING_USER_IN_DB: 'An error occured while inserting User in DB.',
  PROJECT_NOT_FOUND: (id: string) => `The project with id ${id} was not found.`,
};
