
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import logoblanc from "@/assets/logoblanc.png";
import Link from "next/link";
const MainNav = () => {
    return (
        <div className="hidden md:flex">
            <Avatar>
                <Image src={logoblanc} alt="#"/>
            </Avatar>
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
            </nav>
        </div>
    )
}

export default MainNav;