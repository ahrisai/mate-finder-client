import ClientUser from './ClientUser';

export default interface Player extends ClientUser {
  email?: string;
  password?: string;
}
