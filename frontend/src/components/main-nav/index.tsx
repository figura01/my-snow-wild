
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import logoblanc from "@/assets/logoblanc.png";
import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { CircleUserRound, ShoppingBasket } from "lucide-react";
import ThemeSwitcher from "../theme-switcher";
import { CartItemType, useCart }from "@/contexts/CartContext";
import CartItem from "../CartItem";

const MainNav = () => {
    const { cart, getItemCount } = useCart()
    const itemCount = getItemCount();
    console.log(itemCount)
    return (
        <div className="hidden md:flex md:justify-between md:w-full">
            <nav className="flex items-center gap-3">
                <Link href={"/about"}>
                    About
                </Link>
                <Link href={"/products"}>
                    Products
                </Link>
                <Link href={"/contact"}>
                   Contact
                </Link>

                <Link href={"/auth/login"}>
                   Login
                </Link>

                <Link href={"/auth/register"}>
                   Register
                </Link>
            </nav>

            <div className="flex w-full justify-center items-center">
                <Avatar>
                    <Image src={logoblanc} alt="#"/>
                </Avatar>
                <h1 className="text-2xl uppercase">Snow Wild</h1>
            </div>

            <h1 className="flex items-center justify-end gap-2 flex-1">
                
                <Button variant="outline" size="icon">
                    <CircleUserRound />
                </Button>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="relative">
                            <ShoppingBasket />
                            {itemCount > 0&& <Badge
                                className="absolute inline-flex justify-center items-center rounded-full px-1 py-1 h-6 w-6 -top-2 -right-2"
                                variant="destructive"
                            >{itemCount}</Badge> } 
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                        <SheetTitle>Your Cart</SheetTitle>
                        <SheetDescription>
                            {cart?.length > 0 ? (
                                <>
                                    {cart?.map((cart: CartItemType, index) => {
                                        console.log('cartItem: ', cart);
                                        return (
                                            <div key={cart.id + index}>
                                                <CartItem cart={cart} />
                                            </div>
                                        )
                                    })}
                                </>
                               
                            ) : (
                                <p>
                                    No product in your carts
                                </p>
                            )}
                        </SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
                
                <ThemeSwitcher />
            </h1>
        </div>
    )
}

export default MainNav;