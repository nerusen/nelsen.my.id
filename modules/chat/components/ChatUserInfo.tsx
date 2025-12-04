import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiLogOut as SignOutIcon } from "react-icons/fi";

interface ChatUserInfoProps {
  user: {
    name?: string;
    email?: string;
    image?: string;
  };
  isDemo?: boolean;
  onDemoSignOut?: () => void;
}

const ChatUserInfo = ({ user, isDemo = false, onDemoSignOut }: ChatUserInfoProps) => {
  const t = useTranslations("ChatRoomPage.sign_in");

  const handleSignOut = () => {
    if (isDemo && onDemoSignOut) {
      onDemoSignOut();
    } else {
      signOut();
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-neutral-300 py-3 px-4 dark:border-neutral-900">
      <div className="flex items-center space-x-3">
        <div className="relative w-8 h-8 rounded-full overflow-hidden">
          <Image
            src={user.image || "/images/default-avatar.png"}
            alt="Profile"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {user.name}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {user.email}
          </span>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        data-umami-event={isDemo ? "sign_out: Demo" : "sign_out"}
      >
        <SignOutIcon size={14} />
        <span>{t("sign_out_label")}</span>
      </button>
    </div>
  );
};

export default ChatUserInfo;
