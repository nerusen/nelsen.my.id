import { useState } from "react";
import { IoClose as CloseIcon, IoImage as ImageIcon } from "react-icons/io5";
import { useTranslations } from "next-intl";

interface DemoAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { username: string; email: string; image: string | null }) => void;
}

const DemoAccountModal = ({ isOpen, onClose, onSave }: DemoAccountModalProps) => {
  const t = useTranslations("ChatRoomPage.demo_account");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (username && email) {
      onSave({ username, email, image });
      onClose();
      setUsername("");
      setEmail("");
      setImage(null);
      setImageFile(null);
    }
  };

  const handleCancel = () => {
    onClose();
    setUsername("");
    setEmail("");
    setImage(null);
    setImageFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            <CloseIcon size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t("profile_photo")}
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <ImageIcon size={20} className="text-neutral-500" />
              </label>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Image</span>
            </div>
            {image && (
              <img src={image} alt="Profile" className="mt-2 w-16 h-16 rounded-full object-cover" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t("username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder={t("username_placeholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t("email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder={t("email_placeholder")}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!username || !email}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoAccountModal;
