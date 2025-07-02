import ProfileShell from "@/components/profile/ProfileShell"

export default function ProfileLayout({ children }) {
  return (
    <ProfileShell>
      {children}
    </ProfileShell>
  )
}
