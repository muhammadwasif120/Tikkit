export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060810] relative overflow-hidden">
      {children}
    </div>
  )
}