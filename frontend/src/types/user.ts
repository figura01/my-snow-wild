export enum UserRoleEnum {
    admin = 'ADMIN',
    user = 'USER',
}
  
export type UserType = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRoleEnum;
    phone?: string; 
    reservations?: ReservationMaterialInput[]
}