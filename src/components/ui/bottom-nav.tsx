"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MessageCircle, Plus, Tag, User } from "lucide-react";

import { bottomNavItems } from "@/lib/nav";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

type MessageRow = {
  conversation_id: string;
  sender_id: string;
  created_at: string;
};

function NavIcon({
  icon,
  active
}: {
  icon: (typeof bottomNavItems)[number]["icon"];
  active: boolean;
}) {
  switch (icon) {
    case "home":
      return <LayoutGrid className="h-5 w-5" strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />;
    case "market":
      return <Tag className="h-5 w-5" strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />;
    case "post":
      return <Plus className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />;
    case "messages":
      return <MessageCircle className="h-5 w-5" strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />;
    case "profile":
      return <User className="h-5 w-5" strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />;
    default:
      return null;
  }
}

function isItemActive(pathname: string, href: string, icon: (typeof bottomNavItems)[number]["icon"]) {
  if (icon === "post") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (icon === "home") {
    return pathname === "/" || pathname === href || pathname.startsWith(`${href}/`);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const supabase = createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setUnreadCount(0);
          }
          return;
        }

        const { data: conversations, error: conversationsError } = await supabase
          .from("conversations")
          .select("id,buyer_id,seller_id,created_at")
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

        const conversationRows = (conversations ?? []) as ConversationRow[];

        if (conversationsError || conversationRows.length === 0) {
          if (isMounted) {
            setUnreadCount(0);
          }
          return;
        }

        const conversationIds = conversationRows.map((conversation) => conversation.id);
        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select("conversation_id,sender_id,created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        const messageRows = (messages ?? []) as MessageRow[];

        if (messagesError) {
          if (isMounted) {
            setUnreadCount(0);
          }
          return;
        }

        const latestMessageByConversation = new Map<string, { sender_id: string }>();
        for (const message of messageRows) {
          if (!latestMessageByConversation.has(message.conversation_id)) {
            latestMessageByConversation.set(message.conversation_id, {
              sender_id: message.sender_id
            });
          }
        }

        const nextUnreadCount = conversationRows.reduce((count, conversation) => {
          const latestMessage = latestMessageByConversation.get(conversation.id);
          return latestMessage && latestMessage.sender_id !== user.id ? count + 1 : count;
        }, 0);

        if (isMounted) {
          setUnreadCount(nextUnreadCount);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-[#E5E5E5] bg-white"
      aria-label="Primary"
    >
      <div className="grid min-h-[calc(60px+env(safe-area-inset-bottom)+16px)] grid-cols-5 px-2 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        {bottomNavItems.map((item) => {
          const active = isItemActive(pathname, item.href, item.icon);
          const isPost = item.icon === "post";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[60px] min-w-0 items-center justify-center transition-all duration-150 ease-in-out",
                isPost ? "pt-0" : "pt-1"
              )}
              aria-current={active ? "page" : undefined}
            >
              {isPost ? (
                <div className="relative flex h-full items-center justify-center">
                  <div className="absolute -top-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#0039A6] text-white shadow-[0_4px_16px_rgba(0,57,166,0.35)]">
                    <NavIcon icon={item.icon} active={active} />
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 pt-1 transition-colors duration-150 ease-in-out",
                    active ? "text-[#0039A6]" : "text-[#9A9A9A]"
                  )}
                >
                  <div className="relative">
                    <NavIcon icon={item.icon} active={active} />
                    {item.icon === "messages" && unreadCount > 0 ? (
                      <span className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-semibold leading-none text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <span className="font-body text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full bg-[#0039A6] transition-opacity duration-150 ease-in-out",
                      active ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden="true"
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
