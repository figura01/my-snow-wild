import { Button } from "@/components/ui/button"
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Bell, Home, LineChart, Package, Package2, ShoppingCart, Users } from "lucide-react"
import Link from "next/link"

import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import { LIST_CATEGORIES } from "@/requetes/queries/category.queries"

import { useRouter } from "next/router";
import Navigation from "./Navigation";
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
  }
]

const SideBar = () => {
  const router = useRouter()
  const { pathname } = router;
  const { data, loading, error } = useQuery(LIST_CATEGORIES);
  console.log(data)
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
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
        <div className="flex-1">
          <nav className="grow h-full">
            <Command>
              <CommandList>
              
                <Navigation />
                {/* <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Products</AccordionTrigger>
                    <AccordionContent>
                      Yes. It adheres to the WAI-ARIA design pattern.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion> */}
              </CommandList>
            </Command>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default SideBar