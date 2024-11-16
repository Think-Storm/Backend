import { Request } from 'express';
import { UserResponseDto } from '../../user/dtos/userResponse.dto';

interface RequestWithUser extends Request {
  user: UserResponseDto;
}
export default RequestWithUser;
