import { Avatar } from "../ui/avatar";
import Link from "next/link";
import Image from "next/image";
import logoblanc from "@/assets/logoblanc.png"
import { AlignJustify, CircleUserRound, ShoppingBasket } from 'lucide-react';
import { Button } from "../ui/button";
import { Separator } from "@/components/ui/separator";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import ThemeSwitcher from "../theme-switcher";

const MobileNav = () => {
    return (
        <div className="flex justify-between items-center w-full md:hidden">
            <Sheet>
                <SheetTrigger><AlignJustify /></SheetTrigger>
                <SheetContent side="left" aria-describedby={undefined}>
                    <SheetHeader>
                        <SheetTitle>
                            <div className="flex items-center">
                                <Avatar>
                                    <Image src={logoblanc} alt="#"/>
                                </Avatar>
                                Snow Wild
                            </div>
                        </SheetTitle>
                        <SheetDescription className="hidden"></SheetDescription>
                        
                        <nav className="flex flex-col items-start gap-3">
                            <Link href={"/about"}>
                                About
                            </Link>
                            <Link href={"/products"}>
                                Products
                            </Link>
                            <Link href={"/contact"}>
                                Contact
                            </Link>
                            <Separator />
                            <Button 
                                variant={'default'} asChild 
                            >
                                <Link href="/">
                                    Login
                                </Link>
                            </Button>
                            
                            
                            <Button variant={'outline'} asChild>
                                <Link href="/">
                                    Register
                                </Link>
                            </Button>
                        </nav>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
            <h1 className="flex justify-end items-center font-extrabold flex-1">
                <Image 
                    src={logoblanc} alt=""
                    className="flex h-8 w-8"
                />
                Snow Wild
            </h1>
            <h1 className="flex items-center justify-end gap-2 flex-1">
                <Button variant="outline" size="icon">
                    <CircleUserRound />
                </Button>
                <Button variant="outline" size="icon">
                    <ShoppingBasket />
                </Button>
                <ThemeSwitcher />
            </h1>
           
        </div>
    )
}

export default MobileNav;