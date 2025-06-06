"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  SignedOut,
  SignInButton,
  SignUpButton,
  SignedIn,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "../ui/button";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Chat = {
  id: string;
  topic: string;
};

async function getChats(): Promise<Chat[]> {
  const res = await fetch("/api/chats");
  if (!res.ok) {
    // Handle error, maybe throw or return empty array
    console.error("Failed to fetch chats");
    return [];
  }
  return res.json();
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<Awaited<ReturnType<typeof getChats>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setOpenMobile, toggleSidebar } = useSidebar();

  useEffect(() => {
    const fetchChats = async () => {
      const chatsData = await getChats();
      setChats(chatsData);
      setIsLoading(false);
    };

    fetchChats();
  }, [pathname]);

  return (
    <Sidebar>
      <SidebarHeader className="pt-5 px-5">
        <div className="flex flex-row justify-between items-center pb-6">
          <Link className="flex flex-row items-center gap-2" href="/">
            <div className="flex flex-row items-center gap-2">
              <div className=" text-zinc-800 dark:text-zinc-100">
                <img
                  src="/logo.svg"
                  alt="DeepSeek Research"
                  className="size-6"
                />
              </div>
              <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                DeepSeek Research
              </div>
            </div>
          </Link>
          <button
            className="p-1 cursor-pointer md:hidden"
            onClick={() => {
              toggleSidebar();
            }}
          >
            <img src="/menu.svg" className="size-5" />
          </button>
        </div>
        <SidebarMenuButton asChild>
          <button
            onClick={() => {
              setOpenMobile(false);
              router.push("/");
            }}
            className="flex justify-center items-center w-full h-10 relative gap-1.5 px-4 py-1.5 rounded !bg-[#dce8ff] border border-[#072d77] cursor-pointer "
          >
            <svg
              width={11}
              height={12}
              viewBox="0 0 11 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-grow-0 flex-shrink-0"
              preserveAspectRatio="none"
            >
              <path
                d="M5.5 1V11M10.5 6H0.5"
                stroke="#072D77"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="flex-grow-0 flex-shrink-0 text-base font-medium text-left text-[#072d77]">
              New Report
            </p>
          </button>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-3 px-5 mt-2">
          <p className="text-xs font-medium text-left text-[#99a1af]">
            Your reports
          </p>

          {isLoading ? (
            <p className="text-base text-left text-[#4a5565]">
              Loading chats...
            </p>
          ) : (
            chats.map((chat) => {
              const isActive = pathname === `/chat/${chat.id}`;
              return (
                <SidebarMenuButton isActive={isActive} asChild key={chat.id}>
                  <Link
                    onClick={() => setOpenMobile(false)}
                    href={`/chat/${chat.id}`}
                    className={`text-base text-left  ${
                      isActive ? "font-medium text-[#1e2939]" : "text-[#4a5565]"
                    }`}
                  >
                    {chat.topic}
                  </Link>
                </SidebarMenuButton>
              );
            })
          )}
          {chats.length === 0 && !isLoading && (
            <p className="text-base text-left text-[#4a5565]">No chats yet.</p>
          )}
        </div>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-row items-center gap-2 px-2">
          <SignedOut>
            <SignInButton>
              <Button variant="secondary" className="text-xs border">
                Log in
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="text-xs">Sign up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton showName />
          </SignedIn>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
