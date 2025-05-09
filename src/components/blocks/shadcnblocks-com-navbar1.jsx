"use client"
import { Book, Menu, Sunset, Trees, Zap } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import { RainbowButton } from "../ui/rainbow-button";
import { StarBorder } from "../ui/star-border";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSingleFeedback } from "@/lib/getPages";
import { useEffect, useState } from "react";


const Navbar1 = ({
  logo = {
    url: "/",
    src: "/dubai-police-logo-color.svg",
    alt: "CX Customer Feedback Explorer",
    title: "Dubai police logo",
  },

  menu = [
    { title: "Home", url: "#" },
    {
      title: "Products",
      url: "#",
      items: [
        {
          title: "Blog",
          description: "The latest industry news, updates, and info",
          icon: <Book className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Company",
          description: "Our mission is to innovate and empower the world",
          icon: <Trees className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Careers",
          description: "Browse job listing and discover our workspace",
          icon: <Sunset className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Support",
          description:
            "Get in touch with our support team or visit our community forums",
          icon: <Zap className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
    {
      title: "Resources",
      url: "#",
      items: [
        {
          title: "Help Center",
          description: "Get all the answers you need right here",
          icon: <Zap className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Contact Us",
          description: "We are here to help you with any questions you have",
          icon: <Sunset className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Status",
          description: "Check the current status of our services and APIs",
          icon: <Trees className="size-5 shrink-0" />,
          url: "#",
        },
        {
          title: "Terms of Service",
          description: "Our terms and conditions for using our services",
          icon: <Book className="size-5 shrink-0" />,
          url: "#",
        },
      ],
    },
    {
      title: "Add Resources",
      url: "#",
    },
    {
      title: "Blog",
      url: "#",
    },
  ],

  mobileExtraLinks = [
    { name: "Press", url: "#" },
    { name: "Contact", url: "#" },
    { name: "Imprint", url: "#" },
    { name: "Sitemap", url: "#" },
  ],

  auth = {
    login: { text: "Log in", url: "#" },
    signup: { text: "Sign up", url: "#" },
  }
}) => {

  const { slug } = useParams(); // Getting `slug` from params
console.log(slug,"slugslugslugslug");
const [feedbackData, setFeedbackData] = useState(null);  // State to store feedback data
const [loading, setLoading] = useState(true);  // Loading state

useEffect(() => {
  if (slug) {
    // Fetch data when the slug is available
    const fetchData = async () => {
      try {
        const data = await getSingleFeedback(slug);
        setFeedbackData(data);  // Set feedback data in state
        console.log(data,"feeeee");
        
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);  // Set loading to false when the fetch is done
      }
    };

    fetchData();
  }
}, [slug]); // Only run when `slug` changes


  return (
    (<section className="py-4 fixed top-0 left-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-[#0a3522]">
      <div className="container mx-auto">
        <nav className="hidden justify-between lg:flex">
        <div className="flex gap-2">
     <Link href="/rag" className="border border-[#005836] text-white px-[20px] py-[6px] rounded-full text-base inline-flex items-center">Custom Rag</Link>
          </div>
          {/* <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div> */}

          <div className="flex items-center gap-6">
            


            <a href={logo.url} className="flex items-center gap-2">
            <span className="text-lg font-light text-white/65 me-3">{feedbackData?.data?.title}</span>
              <div className="w-32 aspect-[32/11] relative">
              <Image src={logo.src} fill alt={logo.alt}/>
              </div>
             
            </a>


          </div>
          
        </nav>
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <a href={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className="w-8" alt={logo.alt} />
              <span className="text-lg font-semibold">{logo.title}</span>
            </a>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <a href={logo.url} className="flex items-center gap-2">
                      <img src={logo.src} className="w-8" alt={logo.alt} />
                      <span className="text-lg font-semibold">
                        {logo.title}
                      </span>
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <div className="my-6 flex flex-col gap-6">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  <div className="border-t py-4">
                    <div className="grid grid-cols-2 justify-start">
                      {mobileExtraLinks.map((link, idx) => (
                        <a
                          key={idx}
                          className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
                          href={link.url}>
                          {link.name}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button asChild variant="outline">
                      <a href={auth.login.url}>{auth.login.text}</a>
                    </Button>
                    <Button asChild>
                      <a href={auth.signup.url}>{auth.signup.text}</a>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>)
  );
};

const renderMenuItem = (item) => {
  if (item.items) {
    return (
      (<NavigationMenuItem key={item.title} className="text-muted-foreground bg-transparent"  >
        <NavigationMenuTrigger className="bg-transparent text-white">{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-black/10  ">
          <ul className="w-80 p-3 ">
            <NavigationMenuLink>
              {item.items.map((subItem) => (
                <li key={subItem.title}>
                  <a
                    className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                    href={subItem.url}>
                    {subItem.icon}
                    <div>
                      <div className="text-sm font-semibold">
                        {subItem.title}
                      </div>
                      {subItem.description && (
                        <p className="text-sm leading-snug text-muted-foreground">
                          {subItem.description}
                        </p>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </NavigationMenuLink>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>)
    );
  }

  return (
    (<a
      key={item.title}
      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-muted hover:text-accent-foreground"
      href={item.url}>
      {item.title}
    </a>)
  );
};

const renderMobileMenuItem = (item) => {
  if (item.items) {
    return (
      (<AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <a
              key={subItem.title}
              className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
              href={subItem.url}>
              {subItem.icon}
              <div>
                <div className="text-sm font-semibold">{subItem.title}</div>
                {subItem.description && (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {subItem.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </AccordionContent>
      </AccordionItem>)
    );
  }

  return (
    (<a key={item.title} href={item.url} className="font-semibold">
      {item.title}
    </a>)
  );
};

export { Navbar1 };
