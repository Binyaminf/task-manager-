import { TelegramSettings } from "@/components/settings/TelegramSettings";

export default function Settings() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="max-w-2xl">
        <TelegramSettings />
      </div>
    </div>
  );
}