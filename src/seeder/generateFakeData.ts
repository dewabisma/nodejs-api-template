import { faker } from '@faker-js/faker';
import { format } from 'date-fns/format';
import bcrypt from 'bcrypt';


import { generateUniqueID } from '../utils/generateId.js';
import type { Promotion } from '../interfaces/Promotion.js';
import type { User } from '../interfaces/User.js';
import { UserRole, UserStatus } from '../models/users.js';

const generateFakeUser = (isAdmin: boolean = false): User => {
  const randomDate = faker.date.anytime();
  const dateOfBirth = format(randomDate, 'dd/MM/yyyy');

  const user = {
    id: generateUniqueID(),
    email: faker.internet.email(),
    password: isAdmin ? 'admin' : faker.internet.password(),
    status: UserStatus.Active,
    username: isAdmin ? 'admin' : faker.internet.userName(),
    dateOfBirth,
    lastLoginAt: new Date(),
    oauthProvider: null,
    oauthUid: null,
    role: isAdmin ? UserRole.Admin : faker.helpers.enumValue(UserRole),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(user.password, salt);

  user.password = hashedPassword;

  return user;
};

const generateFakePromotion = (): Promotion => {
  return {
    id: generateUniqueID(),
    title: faker.word.words(3),
    label: faker.word.words(3),
    href: faker.internet.url(),
    cover: faker.image.url(),
    isActive: faker.datatype.boolean(),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakeData = (amount: number) => {
  if (amount > 100) throw new Error('Amount is max 100.');

  const _ar = Array.from({ length: amount });

  const promotions = _ar.map(() => generateFakePromotion());
  const users = _ar.map((_, idx) => generateFakeUser(idx === 0));

  return {
    promotions,
    users,
  };
};

export default generateFakeData;
