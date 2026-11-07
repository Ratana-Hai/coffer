import { ViewHeader } from "@/components/layout/ViewHeader";
import { SettingsForm } from "@/features/settings/components/SettingsForm";
import { getSettings } from "@/features/settings/queries";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <ViewHeader title="Settings" summary="Preferences, theme and data controls." />
      <SettingsForm settings={settings} />
    </>
  );
}
