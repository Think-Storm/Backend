import { Request } from 'express';
import { UserResponseDto } from '../dtos/userResponse.dto';

interface RequestWithUser extends Request {
  user: UserResponseDto;
}
export default RequestWithUser;
