import { SettingsChrome } from "@/components/settings/SettingsChrome";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsChrome>{children}</SettingsChrome>;
}
