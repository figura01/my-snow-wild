import MobileNav from "../mobile-nav/MobileNav";
import ThemeSwitcher from "../theme-switcher";
import MainNav from '@/components/main-nav'
import { Button } from "../ui/button";
import { CircleUserRound, ShoppingBasket } from "lucide-react";


const SiteHeader = () => {

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="h-14 container w-full flex items-center">
                {/* Desktop */}
                <MainNav />

                {/* Mobile */}
                <MobileNav />

                {/* Desktop & Mobile*/}
                {/* <h1 className="flex items-center justify-end gap-2 flex-1">
                    <Button variant="outline" size="icon">
                        <CircleUserRound />
                    </Button>
                    <Button variant="outline" size="icon">
                        <ShoppingBasket />
                    </Button>
                    <ThemeSwitcher />
                </h1> */}
                  
            </div>
        </header>
    )
}

export default SiteHeader;