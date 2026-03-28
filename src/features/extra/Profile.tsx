import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/context/ThemeToggler";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

interface ProfileData {
  displayName?: string;
  email?: string;
  location?: string;
  bio?: string;
  avatarColor?: string;
}

function getStoredProfile(): ProfileData {
  try {
    const raw = localStorage.getItem("userProfile");
    if (raw) {
      return JSON.parse(raw) as ProfileData;
    }
  } catch {
    // ignore
  }
  return { displayName: "User", email: "" };
}

function Avatar({
  name = "U",
  color = "#374151",
}: {
  name?: string;
  color?: string;
}) {
  const initials =
    name
      ?.trim()
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "U";
  return (
    <div
      aria-label="avatar"
      style={{
        width: 72,
        height: 72,
        borderRadius: 9999,
        backgroundColor: color,
        display: "grid",
        placeItems: "center",
        color: "white",
        fontWeight: 700,
        fontSize: 28,
      }}
    >
      {initials}
    </div>
  );
}

function Profile() {
  const [profile, setProfile] = useState<ProfileData>(getStoredProfile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const saveProfile = useCallback(() => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setSaved("Profile updated");
    setTimeout(() => setSaved(null), 1500);
  }, [profile]);

  return (
    <Card className="bg-zinc-100 dark:bg-zinc-900 w-full max-w-2xl mx-auto border-zinc-200 dark:border-zinc-800 backdrop-blur">
      <CardHeader className="flex items-center justify-between p-4 text-lg">
        <CardTitle className="flex items-center gap-2">Profile</CardTitle>
        <ThemeToggle />
      </CardHeader>
      <CardContent className="space-y-6 px-4 pb-6 md:flex md:gap-6 md:items-start">
        <div className="md:w-1/3 flex-shrink-0 flex items-center justify-center">
          <Avatar
            name={profile.displayName ?? "User"}
            color={profile.avatarColor ?? "#374151"}
          />
        </div>
        <div className="md:w-2/3 w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">
              {profile.displayName ?? "User"}
            </h3>
            <Button
              size="sm"
              onClick={() => setEditing((e) => !e)}
              className={cn("bg-emerald-600 hover:bg-emerald-700 text-white")}
            >
              {editing ? "Done" : "Edit"}
            </Button>
          </div>
          <div className="text-sm text-zinc-600 mb-2">
            {profile.email ?? ""}
          </div>
          {editing ? (
            <div className="grid grid-cols-1 gap-3">
              <Input
                placeholder="Display Name"
                value={profile.displayName ?? "User"}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
              />
              <Input
                placeholder="Location"
                value={profile.location ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, location: e.target.value })
                }
              />
              <textarea
                placeholder="Bio"
                className={cn(
                  "border rounded-md p-2 h-20 w-full bg-transparent border-input text-base",
                )}
                value={profile.bio ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
              />
              <Input
                placeholder="Avatar Color"
                value={profile.avatarColor ?? "#374151"}
                onChange={(e) =>
                  setProfile({ ...profile, avatarColor: e.target.value })
                }
              />
              <Button
                onClick={saveProfile}
                className={cn("bg-emerald-600 hover:bg-emerald-700 text-white")}
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="text-sm text-zinc-700 whitespace-pre-line">
              {profile.bio ?? ""}
            </div>
          )}
          {saved && <div className="mt-2 text-sm text-green-700">{saved}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default Profile;
