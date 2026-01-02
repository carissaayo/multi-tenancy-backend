import { Request } from 'express';
import { UserAdmin } from 'src/models/admin.schema';
import { User } from 'src/models/user.schema';


export interface AuthenticatedRequest extends Request {
  user: UserAdmin|User;
  userId: string;
}
