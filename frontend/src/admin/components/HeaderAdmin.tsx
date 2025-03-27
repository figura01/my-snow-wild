import Image from "next/image";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CircleUser, Home, Bell, LineChart, Menu, Package, Package2, PanelLeft, Search, ShoppingCart, Users, Users2 } from "lucide-react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/router";
import Navigation from "./Navigation";
import { AuthContext } from "@/contexts/authContext";
import { useContext } from "react";

type LinkType = {
  name: string,
  link: string,
  icon: JSX.Element,
}

const links = [
  {
    name: 'Dashboard',
    link: '/admin/dashboard',
    icon: <Home className="h-4 w-4"/>
  },
  {
    name: 'Users',
    link: '/admin/users',
    icon: <Users className="h-4 w-4"/>
  },
  {
    name: 'Products',
    link: '/admin/products',
    icon: <Package className="h-4 w-4"/>
  },
  {
    name: 'Reservations',
    link: '/admin/reservations',
    icon: <ShoppingCart className="h-4 w-4"/>
  },
  {
    name: 'Categories',
    link: '/admin/categories',
    icon: <Package2 className="h-4 w-4"/>
  }
]

const HeaderAdmin = () => {
  const router = useRouter()
  const authCtx = useContext(AuthContext);
  const { pathname } = router;

  const handleLogout = () => {
    console.log("click to logout")
    console.log(authCtx)
    authCtx.logout();
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">SnowWild</span>
            </Link>

            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <nav className="grid gap-2 text-lg font-medium">
            <Navigation />
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Card className="px-3 py-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button
                onClick={handleLogout}
              >
                Logout
              </Button>
              
            </DropdownMenuItem>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
      
    </header>
  )
}

export default HeaderAdmin;