export const notificationMessages = {
  WELCOME: (name: string) => `Hi ${name}! Welcome to ThinkStorm!`,
  JOIN_REQUEST: (projectTitle: string) =>
    `Hey, someone wants to join the project ${projectTitle}!`,
  ACCEPT_JOIN_REQUEST: (projectTitle: string) =>
    `Hey, your join request to the project ${projectTitle} has been accepted!`,
  INVITE_TO_PROJECT: (projectTitle: string) =>
    `Hey, you have been invited to the project ${projectTitle}!`,
};
