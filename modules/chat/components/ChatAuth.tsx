import clsx from "clsx";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { BsGithub as GithubIcon } from "react-icons/bs";
import { FcGoogle as GoogleIcon } from "react-icons/fc";
import { useState } from "react";

import Button from "@/common/components/elements/Button";
import DemoAccountModal from "./DemoAccountModal";

const Providers = [
  {
    id: "google",
    icon: <GoogleIcon size={18} />,
    bgColor: "!bg-white",
    textColor: "text-black",
    eventName: "sign_in: Google",
  },
  {
    id: "github",
    icon: <GithubIcon size={18} />,
    bgColor: "!bg-black",
    textColor: "text-white",
    eventName: "sign_in: Github",
  },
];

const ChatAuth = ({ isWidget = false, onDemoLogin }) => {
  const t = useTranslations("ChatRoomPage.sign_in");
  const demoT = useTranslations("ChatRoomPage.demo_account");
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleDemoLogin = (data) => {
    onDemoLogin(data);
    setIsDemoModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col border-t border-neutral-300 py-1 dark:border-neutral-900">
        <div className="mb-1 space-y-5 px-4 py-3 text-center text-neutral-700 dark:text-neutral-400">
          <p className="text-sm">{t("title")}</p>
          <div
            className={clsx(
              "flex flex-col items-center justify-center gap-4 lg:flex-row lg:gap-5",
              isWidget && "!flex-col !gap-4",
            )}
          >
            <Button
              onClick={() => setIsDemoModalOpen(true)}
              className={`flex w-full items-center justify-center border bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 py-2.5 shadow-sm transition duration-300 hover:scale-105 active:scale-100 lg:w-fit ${isWidget && "!w-full"}`}
              data-umami-event="sign_in: Demo"
            >
              <span>{demoT("title")}</span>
            </Button>
            {Providers.map((provider) => (
              <Button
                key={provider.id}
                onClick={() => signIn(provider.id)}
                className={`flex w-full items-center justify-center border ${provider.bgColor} py-2.5 shadow-sm transition duration-300 hover:scale-105 active:scale-100 lg:w-fit ${isWidget && "!w-full"}`}
                data-umami-event={provider.eventName}
              >
                {provider.icon}
                <span className={provider.textColor}>
                  {t("label")} {provider.id}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <DemoAccountModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSave={handleDemoLogin}
      />
    </>
  );
};

export default ChatAuth;
