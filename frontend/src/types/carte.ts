// @types.todo.ts

export interface ICartSize {
    size: string;
    quantity: number;
}

export interface ICart {
    id: string;
    name: string;
    description: string;
    price: number;
    imgUrl: string;
    sizes: ICartSize[];
}

export type CartContextType = {
    carts: ICart[];
    addToCart: (cart: ICart) => void;
    updateCart: (id: string, updatedCart: ICart) => void;
};