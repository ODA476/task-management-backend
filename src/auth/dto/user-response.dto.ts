import { User } from '../entities/auth.entity';

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;

  constructor(user: User) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
  }
}
