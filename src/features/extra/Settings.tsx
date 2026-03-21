import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/context/ThemeToggler";
import { cn } from "@/lib/utils";

type ProfileData = {
  displayName: string;
  email?: string;
  location?: string;
  bio?: string;
  avatarColor?: string;
};

const Settings = () => {
  const [profile, setProfile] = useState<ProfileData>({
    displayName: "User",
    email: "",
    location: "",
    bio: "",
    avatarColor: "#374151",
  });
  const [saved, setSaved] = useState<string | null>(null);

  // Load any saved profile from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("userProfile");
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile((p) => ({ ...p, ...parsed }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const saveProfile = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setSaved("Profile saved");
    setTimeout(() => setSaved(null), 1500);
  };

  const clearData = () => {
    localStorage.removeItem("userProfile");
    setProfile((p) => ({ ...p, location: "", bio: "" }));
    setSaved("Data cleared");
    setTimeout(() => setSaved(null), 1500);
  };

  return (
    <Card className="bg-zinc-100 dark:bg-zinc-900 w-full max-w-2xl mx-auto border-zinc-200 dark:border-zinc-800 backdrop-blur">
      <CardHeader className="flex items-center justify-between p-4 text-lg">
        <CardTitle className="flex items-center gap-2">Settings</CardTitle>
        <ThemeToggle />
      </CardHeader>
      <CardContent className="space-y-6 px-4 pb-6">
        {/* Personal Info */}
        <section>
          <h4 className="text-sm font-semibold text-zinc-600 mb-2">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-zinc-700">
                Display Name
              </label>
              <Input
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-zinc-700">Email</label>
              <Input value={profile.email ?? ""} readOnly />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm mb-1 text-zinc-700">
                Location
              </label>
              <Input
                value={profile.location ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, location: e.target.value })
                }
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-zinc-700">
                Avatar Color
              </label>
              <Input
                value={profile.avatarColor ?? "#374151"}
                onChange={(e) =>
                  setProfile({ ...profile, avatarColor: e.target.value })
                }
                placeholder="#374151"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm mb-1 text-zinc-700">Bio</label>
            <Textarea
              rows={3}
              value={profile.bio ?? ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell others about you"
            />
          </div>
        </section>

        {/* Actions */}
        <section className="pt-2 border-t border-t-zinc-200 dark:border-t-zinc-700">
          <div className="flex gap-4 flex-wrap items-center justify-between">
            <div className="text-sm text-zinc-600">
              Tip: Updates are saved locally for this demo.
            </div>
            <div className="flex gap-2">
              <Button
                onClick={saveProfile}
                className={cn("bg-emerald-600 hover:bg-emerald-700 text-white")}
              >
                Save
              </Button>
              <Button
                onClick={clearData}
                className={cn("bg-red-600 hover:bg-red-700 text-white")}
              >
                Clear Data
              </Button>
            </div>
          </div>
          {saved && <div className="mt-2 text-sm text-green-700">{saved}</div>}
        </section>
      </CardContent>
    </Card>
  );
};

export default Settings;
