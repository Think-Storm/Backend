interface User {
  role: string;
}

interface RequestWithUserRole extends Request {
  user: User;
}
export default RequestWithUserRole;
